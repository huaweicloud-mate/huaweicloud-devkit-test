#!/usr/bin/env bash
# Hermes Linux 2026-09-18 每日测试 —— 全量重跑（v1.1.5）
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"

BASE="$(cd "$(dirname "$0")" && pwd)"
P="$BASE/evidence/_probes"
SRC="/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src"
MCP="$SRC/mcp-server.mjs"
PKGROOT="/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit"
HDK="/home/testbot2/devkit-test/Hermes/hdk"
SAMPLE="$P/sample-react"
ISO_HOME="$HOME/devkit-test/Hermes/iso-home-20260918"
EVAL="/home/testbot2/devkit-test/Hermes/huaweicloud-devkit-test/eval/harness/run-eval.mjs"

echo "===== [0] 包版本基线 ====="
npm ls -g huaweicloud-devkit --depth=0 2>/dev/null | grep huaweicloud-devkit
node -e "console.log('node', process.version)"

cd "$P"

echo "===== [1] classify (D4-1/2/3/15/16) ====="
node classify-probe.mjs "$SRC" > classify.log 2>&1; echo "exit=$?"; grep -c "=====CASE" classify.log

echo "===== [2] hook (D4-5/7/9/21/22) ====="
node hook-probe.mjs "$MCP" > hook.log 2>&1; echo "exit=$?"; grep -c "=====CASE" hook.log

echo "===== [3] auth (D2-4/11/12) ====="
node auth-probe.mjs "$MCP" > auth.log 2>&1; echo "exit=$?"; grep -c "=====CASE" auth.log

echo "===== [4] protocol (D5-3/D9-*) ====="
node protocol-probe.mjs "$MCP" > protocol.log 2>&1; echo "exit=$?"; grep -c "=====CASE" protocol.log

echo "===== [5] extended (D2-16/D9-9/D1-41) ====="
node extended-probe.mjs "$MCP" > extended.log 2>&1; echo "exit=$?"; grep -c "=====CASE" extended.log

echo "===== [6] d4-8 (Python/Node 策略一致) ====="
bash d4-8-probe.sh > d4-8.log 2>&1; echo "exit=$?"; tail -3 d4-8.log

echo "===== [7] wrap-probe (D4-16 补充) ====="
node wrap-probe.mjs "$SRC" > wrap-probe.log 2>&1; echo "exit=$?"

echo "===== [8] hcl-probe (D4-21 补充) ====="
node hcl-probe.mjs "$SRC" > hcl-probe.log 2>&1; echo "exit=$?"

echo "===== [9] d8 (D8-7 七技能) ====="
node d8-probe.mjs "$MCP" "$PKGROOT" > d8.log 2>&1; echo "exit=$?"; grep -c "=====CASE" d8.log

echo "===== [10] supplement (D1-26/27 D2-2/5 D3-* D4-4/6/11/17 D6-*) ====="
node supplement-probe.mjs "$MCP" "$SAMPLE" > supplement.log 2>&1; echo "exit=$?"; grep -c "=====CASE" supplement.log

echo "===== [11] supplement-import (D1-30 D4-10) ====="
node supplement-import.mjs "$SRC" > supplement-import.log 2>&1; echo "exit=$?"; grep -c "=====CASE" supplement-import.log

echo "===== [12] d1 安装域 (D1-1/3/4/5, 隔离 HOME+HERMES_HOME) ====="
rm -rf "$ISO_HOME" 2>/dev/null
bash d1-probe.sh "$ISO_HOME" > d1.log 2>&1; echo "exit=$?"; grep -c "STEP\|exit=" d1.log

echo "===== [13] updatecheck (D1-28/31/33) ====="
node updatecheck-probe.mjs "$SRC" > updatecheck.log 2>&1; echo "exit=$?"; tail -2 updatecheck.log

echo "===== [14] disttags (D1-39/NR3-10) ====="
node disttags-probe.mjs "$SRC" > disttags.log 2>&1; echo "exit=$?"; tail -2 disttags.log

echo "===== [15] merge (D1-58 白名单合并) ====="
node merge-probe.mjs "$SRC" > merge.log 2>&1; echo "exit=$?"; tail -2 merge.log

echo "===== [16] routing (D10-3 serviceCatalog) ====="
node routing-probe.mjs "$MCP" > routing.log 2>&1; echo "exit=$?"; tail -3 routing.log

echo "===== [17] D1-40 反向下发防护 ====="
node D1-40-probe.mjs "$SRC" > d1-40.log 2>&1; echo "exit=$?"; tail -2 d1-40.log

echo "===== [18] D1-42 dismiss ====="
node D1-42-probe.mjs "$SRC" > d1-42.log 2>&1; echo "exit=$?"; tail -2 d1-42.log

echo "===== [19] D1-45 兜底+预热 ====="
node D1-45-probe.mjs "$SRC" > d1-45.log 2>&1; echo "exit=$?"; tail -2 d1-45.log

echo "===== [20] D5-1 清单发现 ====="
node D5-1-probe.mjs "$HDK" > d5-1.log 2>&1; echo "exit=$?"; tail -2 d5-1.log

echo "===== [21] D4-6 脱敏 (redactString CLI flag / JSON key) ====="
node D4-6-probe.mjs "$SRC" > d4-6.log 2>&1; echo "exit=$?"; tail -2 d4-6.log

echo "===== [22] D2-26 凭证备份/恢复 (backend) ====="
node D2-26-probe.mjs > d2-26.log 2>&1; echo "exit=$?"; tail -3 d2-26.log

echo "===== [23] D4-27 redactSecrets/redactOutput 双路径脱敏 ====="
node D4-27-probe.mjs > d4-27.log 2>&1; echo "exit=$?"; tail -3 d4-27.log

echo "===== ALL DONE (source-level probes) ====="