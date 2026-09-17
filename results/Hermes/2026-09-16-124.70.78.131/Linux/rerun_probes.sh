#!/usr/bin/env bash
# Hermes Linux 2026-09-15 每日测试 —— 强制完整重跑：重新运行全部主探针 + 重新分发证据
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"

BASE="$(cd "$(dirname "$0")" && pwd)"
P="$BASE/evidence/_probes"
SRC="/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src"
MCP="$SRC/mcp-server.mjs"
PKGROOT="/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit"
SAMPLE="$P/sample-react"
ISO_HOME="$HOME/devkit-test/Hermes/iso-home-20260915-rerun"

echo "== [0] 包版本基线 =="
npm ls -g huaweicloud-devkit --depth=0 2>/dev/null | grep huaweicloud-devkit
node -e "console.log('node', process.version)"

cd "$P"

echo "== [1] classify (D4-1/2/3/15/16) =="
node classify-probe.mjs "$SRC" > classify.log 2>&1; echo "exit=$?"; tail -2 classify.log

echo "== [2] hook (D4-5/7/9/21/22) =="
node hook-probe.mjs "$MCP" > hook.log 2>&1; echo "exit=$?"; grep -c "=====CASE" hook.log

echo "== [3] auth (D2-4/11/12) =="
node auth-probe.mjs "$MCP" > auth.log 2>&1; echo "exit=$?"; grep -c "=====CASE" auth.log

echo "== [4] protocol (D5-3/D9-*) =="
node protocol-probe.mjs "$MCP" > protocol.log 2>&1; echo "exit=$?"; grep -c "=====CASE" protocol.log

echo "== [5] extended (D2-16/D9-9/D1-41) =="
node extended-probe.mjs "$MCP" > extended.log 2>&1; echo "exit=$?"; grep -c "=====CASE" extended.log

echo "== [6] d4-8 (Python/Node 策略一致) =="
bash d4-8-probe.sh > d4-8.log 2>&1; echo "exit=$?"; tail -3 d4-8.log

echo "== [7] wrap-probe (D4-16 补充) =="
node wrap-probe.mjs "$SRC" > wrap-probe.log 2>&1; echo "exit=$?"

echo "== [8] hcl-probe (D4-21 补充) =="
node hcl-probe.mjs "$SRC" > hcl-probe.log 2>&1; echo "exit=$?"

echo "== [9] d8 (D8-7 七技能) =="
node d8-probe.mjs "$MCP" "$PKGROOT" > d8.log 2>&1; echo "exit=$?"; grep -c "=====CASE" d8.log

echo "== [10] supplement (D1-26/27 D2-2/5 D3-* D4-4/6/11/17 D6-*) =="
node supplement-probe.mjs "$MCP" "$SAMPLE" > supplement.log 2>&1; echo "exit=$?"; grep -c "=====CASE" supplement.log

echo "== [11] supplement-import (D1-30 D4-10) =="
node supplement-import.mjs "$SRC" > supplement-import.log 2>&1; echo "exit=$?"; grep -c "=====CASE" supplement-import.log

echo "== [12] d1 安装域 (D1-1/3/4/5, 隔离 HOME+HERMES_HOME) =="
bash d1-probe.sh "$ISO_HOME" > d1.log 2>&1; echo "exit=$?"; grep -c "STEP\|exit=" d1.log

echo "== 重新分发证据 =="
cd "$BASE"
python3 distribute_evidence.py
python3 distribute_supplement.py
echo "== 完成 =="