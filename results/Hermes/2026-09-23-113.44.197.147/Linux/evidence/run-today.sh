#!/usr/bin/env bash
# 每日测试执行 runner — Hermes / Linux / v1.1.6 (fresh 全量重跑 2026-09-23)
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
export HDK_PLUGIN_SRC="/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core"
export HDK_MCP_SERVER="/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"
export EVID_DIR="/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-113.44.197.147/Linux/evidence"
export HDK_REGION="cn-north-4"

cd "$EVID_DIR"
echo "=== SUT ==="; huaweicloud-devkit version 2>&1 | head -2
echo "=== HDK HEAD ==="; git -C /home/testbot1/devkit-test/Hermes/hdk log --oneline -1
echo "=== 时间戳 $(date '+%Y-%m-%d %H:%M:%S %Z') ==="

run_node() {
  echo; echo "########## $1 -> fresh-$2.txt ##########"
  node "$1" > "fresh-$2.txt" 2>&1
  echo "exit=$?"
}

run_node probe-security.mjs security
run_node probe-supplement2.mjs supplement2
run_node probe-remaining.mjs remaining
run_node probe-final.mjs final
run_node probe-d1-41.mjs d1-41
run_node probe-tools.mjs tools
run_node probe-matrix.mjs matrix
run_node probe-protocol.mjs protocol
run_node probe-supplement.mjs supplement
run_node D2-auth-probe.mjs auth
run_node D4-approval-probe.mjs approval
run_node D3-C4-run.mjs c4
run_node probe-newcases.mjs newcases
run_node probe-d9-10.mjs d9-10

echo; echo "########## probe-cli.sh -> fresh-cli.txt ##########"
bash probe-cli.sh > fresh-cli.txt 2>&1; echo "exit=$?"

echo; echo "########## probe-hook.sh -> fresh-hook.txt ##########"
bash probe-hook.sh > fresh-hook.txt 2>&1; echo "exit=$?"

echo; echo "########## probe-hookchain-cli.sh -> fresh-hookchain.txt ##########"
bash probe-hookchain-cli.sh > fresh-hookchain.txt 2>&1; echo "exit=$?"

echo; echo "########## probe-d158.sh -> fresh-d158.txt ##########"
bash probe-d158.sh > fresh-d158.txt 2>&1; echo "exit=$?"

echo; echo "########## probe-d4-25.py -> fresh-d4-25.txt ##########"
python3 probe-d4-25.py > fresh-d4-25.txt 2>&1; echo "exit=$?"

echo; echo "########## D10-3 eval harness -> eval-harness.txt ##########"
node /home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test/eval/harness/run-eval.mjs "$HDK_MCP_SERVER" > eval-harness.txt 2>&1; echo "exit=$?"

echo; echo "====== D2-26 备份恢复 (HUAWEICLOUD_HOME 隔离) ======"
HUAWEICLOUD_HOME=$(mktemp -d) node D2-26/probe.mjs > fresh-d2-26.txt 2>&1; echo "exit=$?"

echo; echo "====== D4-27 双路径脱敏 ======"
node D4-27/probe.mjs > fresh-d4-27.txt 2>&1; echo "exit=$?"

echo; echo "ALL SOURCE-LEVEL PROBES DONE $(date '+%H:%M:%S')"