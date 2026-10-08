#!/usr/bin/env bash
# OpenClaw Linux 2026-10-09 每日测试（v1.1.8-next.1 gitHead ffd7b47）
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

BASE="$(cd "$(dirname "$0")" && pwd)"
P="$BASE/evidence/_probes"
HDK="/home/testbot1/devkit-test/OpenClaw/hdk"
SRC="$HDK/plugins/huaweicloud-core/src"
MCP="$SRC/mcp-server.mjs"
PKGROOT="$HDK"
SAMPLE="$P/sample-react"
ISO_HOME="$BASE/iso-home-20261009"
EVAL="/home/testbot1/devkit-test/OpenClaw/huaweicloud-devkit-test/eval/harness/run-eval.mjs"
FIX="/home/testbot1/devkit-test/OpenClaw/huaweicloud-devkit-test/eval/harness/fixtures/run-all.mjs"

echo "===== [0] 包版本基线 ===== ($(date '+%F %T'))"
npm ls -g huaweicloud-devkit --depth=0 2>/dev/null | grep huaweicloud-devkit
node -e "console.log('node', process.version)"
git -C "$HDK" rev-parse HEAD 2>/dev/null

cd "$P"

echo "===== [1] classify (D4-1/2/3/15/16) ===== "
node classify-probe.mjs "$SRC" > classify.log 2>&1; echo "exit=$?"; grep -c "=====CASE" classify.log

echo "===== [2] hook (D4-5/7/9/21/22) ===== "
node hook-probe.mjs "$MCP" > hook.log 2>&1; echo "exit=$?"; grep -c "=====CASE" hook.log

echo "===== [3] auth (D2-4/11/12) ===== "
node auth-probe.mjs "$MCP" > auth.log 2>&1; echo "exit=$?"; grep -c "=====CASE" auth.log

echo "===== [4] protocol (D5-3/D9-*) ===== "
node protocol-probe.mjs "$MCP" > protocol.log 2>&1; echo "exit=$?"; grep -c "=====CASE" protocol.log

echo "===== [5] extended (D2-16/D9-9/D1-41) ===== "
node extended-probe.mjs "$MCP" > extended.log 2>&1; echo "exit=$?"; grep -c "=====CASE" extended.log

echo "===== [6] d4-8 (Python/Node 策略一致) ===== "
bash d4-8-probe.sh > d4-8.log 2>&1; echo "exit=$?"; tail -3 d4-8.log

echo "===== [7] supplement (D1-26/27 D2-2/5 D3-* D4-4/6/11/17 D6-*) ===== "
node supplement-probe.mjs "$MCP" "$SAMPLE" > supplement.log 2>&1; echo "exit=$?"; grep -c "=====CASE\|check(" supplement.log

echo "===== [8] supplement-import (D1-30 D4-10) ===== "
node supplement-import.mjs "$SRC" > supplement-import.log 2>&1; echo "exit=$?"; grep -c "=====CASE\|check(" supplement-import.log

echo "===== [9] d1 安装域 (D1-1/3/4/5, 隔离 HOME) ===== "
rm -rf "$ISO_HOME" 2>/dev/null
bash d1-probe.sh "$ISO_HOME" > d1.log 2>&1; echo "exit=$?"; grep -c "STEP\|exit=" d1.log

echo "===== [10] updatecheck (D1-28/31/33) ===== "
node updatecheck-probe.mjs "$SRC" > updatecheck.log 2>&1; echo "exit=$?"; tail -2 updatecheck.log

echo "===== [11] D1-40 反向下发防护 ===== "
node D1-40-probe.mjs "$SRC" > d1-40.log 2>&1; echo "exit=$?"; tail -2 d1-40.log

echo "===== [12] D1-42 dismiss ===== "
node D1-42-probe.mjs "$SRC" > d1-42.log 2>&1; echo "exit=$?"; tail -2 d1-42.log

echo "===== [13] D1-45 兜底+预热 ===== "
node D1-45-probe.mjs "$SRC" > d1-45.log 2>&1; echo "exit=$?"; tail -2 d1-45.log

echo "===== [14] D5-1 清单发现 ===== "
node D5-1-probe.mjs "$HDK" > d5-1.log 2>&1; echo "exit=$?"; tail -2 d5-1.log

echo "===== [15] D4-6 脱敏 ===== "
node D4-6-probe.mjs "$SRC" > d4-6.log 2>&1; echo "exit=$?"; tail -2 d4-6.log

echo "===== [16] D2-26 凭证备份/恢复 ===== "
node D2-26-probe.mjs > d2-26.log 2>&1; echo "exit=$?"; tail -3 d2-26.log

echo "===== [17] D4-27 redactSecrets/redactOutput 双路径脱敏 ===== "
node D4-27-probe.mjs > d4-27.log 2>&1; echo "exit=$?"; tail -3 d4-27.log

echo "===== [18] new-env (D1-65/66/67/68) ===== "
node new-env-probe.mjs > new-env.log 2>&1; echo "exit=$?"; grep -c "CASE\|check(" new-env.log

echo "===== [19] new-config (D2-27/D1-70/D8-9/D8-10/D6-9) ===== "
node new-config-probe.mjs > new-config.log 2>&1; echo "exit=$?"; grep -c "CASE\|check(" new-config.log

echo "===== [20] new-safety (D10-4/D4-26/D4-29/D4-28/D4-25) ===== "
node new-safety-probe.mjs > new-safety.log 2>&1; echo "exit=$?"; grep -c "CASE\|check(" new-safety.log

echo "===== [21] new-mcp (D9-10/D9-11) ===== "
node new-mcp-probe.mjs > new-mcp.log 2>&1; echo "exit=$?"; grep -c "CASE\|check(" new-mcp.log

echo "===== [22] new-cli (D1-69) ===== "
node new-cli-probe.mjs > new-cli.log 2>&1; echo "exit=$?"; grep -c "CASE\|check(" new-cli.log

echo "===== [23] new-scenario (D3-S1/S5/S8) ===== "
node new-scenario-probe.mjs > new-scenario.log 2>&1; echo "exit=$?"; grep -c "CASE\|check(" new-scenario.log

echo "===== [24] new-cloud (D3-S2/C13/C14/S4/S3) ===== "
node new-cloud-probe.mjs > new-cloud.log 2>&1; echo "exit=$?"; grep -c "CASE\|check(" new-cloud.log

echo "===== [25] new-fg-rds (D3-S6/S7) ===== "
node new-fg-rds-probe.mjs > new-fg-rds.log 2>&1; echo "exit=$?"; grep -c "CASE\|check(" new-fg-rds.log

echo "===== [26] routing (D10-3 serviceCatalog) ===== "
node routing-probe.mjs "$MCP" > routing.log 2>&1; echo "exit=$?"; tail -3 routing.log

echo "===== [27] eval-harness (D10-3 serviceCatalog 15 条) ===== "
node "$EVAL" "$MCP" > eval-harness.log 2>&1; echo "exit=$?"; tail -4 eval-harness.log

echo "===== [28] exp-e08 诊断路由 ===== "
node EXP-E08-probe.mjs "$MCP" > exp-e08.log 2>&1; echo "exit=$?"; tail -2 exp-e08.log

echo "===== [29] D9-12 initialize 握手协议安全基线 (P0) ===== "
node D9-12-probe.mjs "$SRC" > d9-12.log 2>&1; echo "exit=$?"; grep -c "CASE\|OK\]\|FAIL\]" d9-12.log

echo "===== [30] D9-13 tools/call 凭证不泄露与权限校验 (P0) ===== "
node D9-13-probe.mjs "$SRC" > d9-13.log 2>&1; echo "exit=$?"; grep -c "CASE\|OK\]\|FAIL\]" d9-13.log

echo "===== [31] fixtures run-all (D1-66/69 D2-10/13/27 D3-C14 D4-12/29 D8-10 D9-6/9/10/11) ===== "
node "$FIX" "$SRC" --evid "$BASE/evidence/fixtures-out" > fixtures.log 2>&1; echo "exit=$?"; tail -20 fixtures.log

echo "===== [32] realcloud (D2-1/D3-C4/D4-14/D4-18/19/20 真云建删归零) ===== "
node realcloud-probe.mjs > realcloud.log 2>&1; echo "exit=$?"; grep -c "OK\|FAIL" realcloud.log; tail -25 realcloud.log

echo "===== [33] D4-13 只读子账号最小权限 (真云) ===== "
node D4-13-probe.mjs > d4-13.log 2>&1; echo "exit=$?"; tail -15 d4-13.log

echo "===== ALL DONE (source + realcloud probes) ===== $(date '+%F %T')"