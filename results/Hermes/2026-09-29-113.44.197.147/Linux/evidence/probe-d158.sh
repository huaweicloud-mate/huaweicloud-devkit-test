#!/usr/bin/env bash
# D1-58 通用 MCP 白名单接入（Claude/Cursor merge）——真机执行探针
#
# 关键点：setup-cli.mjs 的 detectAgents() 会因 HERMES_HOME 环境变量命中 "hermes"，
# 导致 install 直接为 hermes 安装、永远走不到 promptZeroDetect 菜单 option3。
# 本探针隔离 HOME 并将 HERMES_HOME 指到不存在的目录，使 detectAgents() 返回空 →
# promptZeroDetect() 菜单 → 输入 3 → configureGenericMCP()（setup-cli.mjs:3284）。
# 从而通过 PTY 直驱真实 `huaweicloud-devkit install` 端到端执行 D1-58 五子断言。
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:/usr/bin:/bin"
DEVKIT="huaweicloud-devkit"
OUT="${1:?用法: $0 <输出目录>}"
mkdir -p "$OUT"
BASE="$(mktemp -d /tmp/hdk-d158.XXXXXX)"
trap 'rm -rf "$BASE"' EXIT

sha() { sha256sum "$1" | awk '{print $1}'; }

run_wire() {  # iso label outfile
  local iso="$1" label="$2" outfile="$3"
  {
    echo "=============== $label ==============="
    echo "[fixture HOME] $iso"
    printf '3\n' | env -i HOME="$iso" HERMES_HOME="$iso/.hermes-notexist" \
      PATH="$HOME/nodejs/bin:$HOME/bin:/usr/bin:/bin" \
      script -qec "$DEVKIT install" /dev/null 2>&1 \
      | grep -viE 'ExperimentalWarning|trace-warnings|^[[:space:]]*$'
    echo ""
    echo "-------- 产物/文件状态 --------"
    [ -f "$iso/.claude.json" ] && { echo "[.claude.json 内容]"; cat "$iso/.claude.json"; echo; }
    [ -f "$iso/.claude.json.bak" ] && { echo "[.claude.json.bak 内容]"; cat "$iso/.claude.json.bak"; echo; }
    [ -f "$iso/.cursor/mcp.json" ] && { echo "[.cursor/mcp.json 内容]"; cat "$iso/.cursor/mcp.json"; echo; }
    [ -f "$iso/.cursor/mcp.json.bak" ] && { echo "[.cursor/mcp.json.bak 内容]"; cat "$iso/.cursor/mcp.json.bak"; echo; }
    echo "[文件清单]"; find "$iso" -type f | sort
  } > "$outfile" 2>&1
}

# ---- EXP-D1-58-01 白名单探测（双命中：Claude + Cursor 同时存在）----
ISO="$BASE/c01"; mkdir -p "$ISO/.cursor"
printf '{"mcpServers":{"other-claude":{"command":"x"}}}' > "$ISO/.claude.json"
printf '{"mcpServers":{"other-cursor":{"command":"y"}}}' > "$ISO/.cursor/mcp.json"
run_wire "$ISO" "EXP-D1-58-01 双命中(Claude+Cursor)" "$OUT/c01.txt"

# ---- EXP-D1-58-02 命中 merge（fake ~/.claude.json，含其它键）----
ISO="$BASE/c02"; mkdir -p "$ISO"
printf '{"mcpServers":{"other-server":{"command":"x"}},"project":{"owner":"alice"}}' > "$ISO/.claude.json"
run_wire "$ISO" "EXP-D1-58-02 命中 merge(fake .claude.json)" "$OUT/c02.txt"

# ---- EXP-D1-58-03 同 key 跳过（已含 huaweicloud-devkit）----
ISO="$BASE/c03"; mkdir -p "$ISO"
printf '{"mcpServers":{"huaweicloud-devkit":{"command":"npx"}}}' > "$ISO/.claude.json"
run_wire "$ISO" "EXP-D1-58-03 同 key 跳过(已配置)" "$OUT/c03.txt"

# ---- EXP-D1-58-04 坏 JSON 零写入 ----
ISO="$BASE/c04"; mkdir -p "$ISO"
printf '{invalid json' > "$ISO/.claude.json"
BEFORE=$(sha "$ISO/.claude.json")
run_wire "$ISO" "EXP-D1-58-04 坏 JSON 零写入" "$OUT/c04.txt"
AFTER=$(sha "$ISO/.claude.json")
{
  echo "[sha256 before] $BEFORE"
  echo "[sha256 after ] $AFTER"
  [ "$BEFORE" = "$AFTER" ] && echo "[字节一致性] 一致(零写入)" || echo "[字节一致性] 不一致(有写入!)"
} >> "$OUT/c04.txt"

# ---- EXP-D1-58-05 未命中 snippet（无 Claude/Cursor，空 HOME）----
ISO="$BASE/c05"; mkdir -p "$ISO"
run_wire "$ISO" "EXP-D1-58-05 未命中 snippet(无配置)" "$OUT/c05.txt"

echo "PROBE DONE → $OUT"
ls -la "$OUT"