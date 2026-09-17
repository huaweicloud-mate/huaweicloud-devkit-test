#!/usr/bin/env bash
# D1-58 白名单矩阵（EXP-D1-58-01~05）真机执行驱动。
# 通过 util-linux `script` 分配 PTY，向 install 菜单 option3（generic MCP）喂 "3"，
# 在隔离 HOME 下复现代理检测(Claude Code/Cursor)与 merge 逻辑，逐条断言。
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/node22/bin:$HOME/bin:$PATH"

D="$HOME/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-15-1.94.218.129/Linux"
EVID="$D/evidence"
SCRATCH="$D/d158scratch"
rm -rf "$SCRATCH"; mkdir -p "$SCRATCH"

# 隔离 HOME 下喂 option3，返回归一化输出（去 \r）
run_opt3() {
  printf '3\n' | timeout 40 script -qec \
    "env -u HERMES_HOME -u DSH_HOME -u ATOMCODE_HOME -u HUAWEICLOUD_HOME -u OFFICE_CLAW_CONFIG_ROOT -u CLAUDE_CONFIG_DIR HOME='$1' huaweicloud-devkit install" \
    /dev/null 2>&1 | sed 's/\r$//'
}

write_ev() { # $1=cid $2=content
  mkdir -p "$EVID/$1"
  printf '%s\n' "$2" > "$EVID/$1/stdout.log"
  echo "== 落盘 $EVID/$1/stdout.log =="
}

# ---------------- E01 白名单探测（双命中：Claude + Cursor 均被感知并配置） ----------------
I="$SCRATCH/e01"; mkdir -p "$I/.cursor"
printf '{"mcpServers": {}}' > "$I/.claude.json"
printf '{"mcpServers": {}}' > "$I/.cursor/mcp.json"
E01_OUT=$(run_opt3 "$I")
E01_VERDICT=$(
  if echo "$E01_OUT" | grep -q "\[Claude Code\] MCP server configured"; then c=1; else c=0; fi
  if echo "$E01_OUT" | grep -q "\[Cursor\] MCP server configured"; then r=1; else r=0; fi
  if [ "$c" = 1 ] && [ "$r" = 1 ]; then echo "PASS  白名单探测双命中：~/.claude.json 与 ~/.cursor/mcp.json 均被感知并配置（Claude Code=$c Cursor=$r）";
  else echo "FAIL  白名单探测未双命中（Claude Code=$c Cursor=$r）"; fi
)
E01_MERGED_CLAUDE=$(node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(Boolean(c.mcpServers && c.mcpServers["huaweicloud-devkit"])?"claude merged ok":"claude NOT merged")' "$I/.claude.json")
E01_MERGED_CURSOR=$(node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(Boolean(c.mcpServers && c.mcpServers["huaweicloud-devkit"])?"cursor merged ok":"cursor NOT merged")' "$I/.cursor/mcp.json")
write_ev "EXP-D1-58-01" "=== 场景：空 HOME（隔离）跑 install 菜单 option3，断言探测 ~/.claude.json 与 ~/.cursor/mcp.json（存在性感知） ===
$E01_OUT
=== 断言 ===
$E01_VERDICT
$E01_MERGED_CLAUDE
$E01_MERGED_CURSOR"

# ---------------- E02 命中 merge（fake ~/.claude.json：.bak + 唯一合并 + 其余键完好） ----------------
I="$SCRATCH/e02"; mkdir -p "$I"
printf '{"project":{"owner":"alice"},"custom":123,"mcpServers":{}}' > "$I/.claude.json"
E02_OUT=$(run_opt3 "$I")
E02_BAK="no"; [ -f "$I/.claude.json.bak" ] && E02_BAK="yes"
E02_MERGE=$(node -e '
const fs=require("fs");
const c=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
const ownerOk=c.project && c.project.owner==="alice";
const customOk=c.custom===123;
const mk=Object.keys(c.mcpServers||{});
const hd=mk.filter(k=>k.includes("huaweicloud-devkit"));
console.log(`owner=${ownerOk} custom=${customOk} hdUnique=${hd.length===1} hdKeys=${hd.join(",")||"(none)"}`);
' "$I/.claude.json")
E02_VERDICT=$(
  if [ "$E02_BAK" = "yes" ] && echo "$E02_MERGE" | grep -q "owner=true custom=true hdUnique=true"; then
    echo "PASS  命中合并：.bak 生成 + mcpServers.huaweicloud-devkit 唯一 + 其余键完好"
  else
    echo "FAIL  命中合并异常（bak=$E02_BAK $E02_MERGE）"
  fi
)
write_ev "EXP-D1-58-02" "=== 场景：构造 fake ~/.claude.json（含 project.owner/custom），断言 .bak 备份 + merge 唯一 + 其余键完好 ===
$E02_OUT
=== 断言 ===
.bak 备份存在=$E02_BAK
原键保留: $E02_MERGE
$E02_VERDICT"

# ---------------- E03 同 key 跳过（已含 huaweicloud-devkit → skipping + 无新 .bak） ----------------
I="$SCRATCH/e03"; mkdir -p "$I"
printf '{"mcpServers":{"huaweicloud-devkit":{"command":"npx","args":["-y","-p","huaweicloud-devkit","huaweicloud-devkit-mcp"]}}}' > "$I/.claude.json"
E03_OUT=$(run_opt3 "$I")
E03_BAK_CNT=$(find "$I" -name '*.bak' | wc -l | tr -d ' ')
E03_VERDICT=$(
  if echo "$E03_OUT" | grep -q "already configured; skipping" && [ "$E03_BAK_CNT" = "0" ]; then
    echo "PASS  同 key 跳过：输出含 skipping + .bak 数量 0（不新造备份）"
  else
    echo "FAIL  同 key 跳过异常（skip命中=$(echo "$E03_OUT" | grep -c 'already configured; skipping') bak数=$E03_BAK_CNT）"
  fi
)
write_ev "EXP-D1-58-03" "=== 场景：已含 huaweicloud-devkit 的 ~/.claude.json 重跑 option3，断言 skipping + 无新 .bak（唯一性） ===
$E03_OUT
=== 断言 ===
.bak 计数=$E03_BAK_CNT
$E03_VERDICT"

# ---------------- E04 坏 JSON 零写入 ----------------
I="$SCRATCH/e04"; mkdir -p "$I"
printf '{ "broken": ' > "$I/.claude.json"
E04_BEFORE=$(sha256sum "$I/.claude.json" | cut -d' ' -f1)
E04_OUT=$(run_opt3 "$I")
E04_AFTER=$(sha256sum "$I/.claude.json" | cut -d' ' -f1)
E04_VERDICT=$(
  if echo "$E04_OUT" | grep -q "not valid JSON" && [ "$E04_BEFORE" = "$E04_AFTER" ]; then
    echo "PASS  坏 JSON 零写入：报 not valid JSON + sha256 前后一致（$E04_BEFORE）"
  else
    echo "FAIL  坏 JSON 处理异常（notValidJSON命中=$(echo "$E04_OUT" | grep -c 'not valid JSON') shaEq=$([ "$E04_BEFORE" = "$E04_AFTER" ] && echo yes || echo no)）"
  fi
)
write_ev "EXP-D1-58-04" "=== 场景：损坏 JSON 的 ~/.claude.json 跑 option3，断言报 not valid JSON + 原文件字节不变（零写入） ===
$E04_OUT
=== 断言 ===
before.sha256=$E04_BEFORE
after.sha256 =$E04_AFTER
$E04_VERDICT"

# ---------------- E05 未命中 snippet（无 Claude/Cursor → 可粘贴 stdio 片段 + remote 提示） ----------------
I="$SCRATCH/e05"; mkdir -p "$I"
E05_OUT=$(run_opt3 "$I")
E05_VERDICT=$(
  if echo "$E05_OUT" | grep -q "No known MCP agent detected" \
     && echo "$E05_OUT" | grep -q "mcpServers" \
     && echo "$E05_OUT" | grep -q "huaweicloud-devkit-mcp"; then
    echo "PASS  未命中 snippet：含 mcpServers 键文本 + npx huaweicloud-devkit-mcp + remote 提示（可粘贴）"
  else
    echo "FAIL  未命中 snippet 缺失（snippet=$(echo "$E05_OUT" | grep -c 'No known MCP agent detected') mcpServers=$(echo "$E05_OUT" | grep -c 'mcpServers') remote=$(echo "$E05_OUT" | grep -c 'huaweicloud-devkit-mcp')）"
  fi
)
write_ev "EXP-D1-58-05" "=== 场景：无 Claude/Cursor 配置的隔离 HOME 跑 option3，断言输出可粘贴 stdio 片段（mcpServers + remote 提示） ===
$E05_OUT
=== 断言 ===
$E05_VERDICT"

echo "=== 汇总 ==="
echo "[E01] $E01_VERDICT"
echo "[E02] $E02_VERDICT"
echo "[E03] $E03_VERDICT"
echo "[E04] $E04_VERDICT"
echo "[E05] $E05_VERDICT"