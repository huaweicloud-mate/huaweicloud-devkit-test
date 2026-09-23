#!/usr/bin/env bash
# OpenCode / Linux / v1.1.6 每日测试执行 runner（fresh 全量重跑）
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
export HDK_PLUGIN_SRC="/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core"
export HDK_MCP_SERVER="$HDK_PLUGIN_SRC/src/mcp-server.mjs"
export EVID_DIR="/home/zhangshuang/devkit-test/OpenCode/huaweicloud-devkit-test/results/OpenCode/2026-09-23-113.44.143.91/Linux/evidence"
export HDK_REGION="cn-north-4"

cd "$EVID_DIR"
echo "=== SUT ==="; huaweicloud-devkit version 2>&1 | head -2
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

echo; echo "########## probe-d4-25.py -> fresh-d4-25.txt ##########"
python3 probe-d4-25.py > fresh-d4-25.txt 2>&1; echo "exit=$?"

echo; echo "########## D10-3/EXP-E eval harness -> eval-harness.txt ##########"
node /home/zhangshuang/devkit-test/OpenCode/huaweicloud-devkit-test/eval/harness/run-eval.mjs "$HDK_MCP_SERVER" > eval-harness.txt 2>&1; echo "exit=$?"

echo; echo "########## D4-27 双路径脱敏 -> fresh-d4-27.txt ##########"
node D4-27/probe.mjs > fresh-d4-27.txt 2>&1; echo "exit=$?"

echo; echo "########## D2-26 备份恢复 (HUAWEICLOUD_HOME 隔离) -> fresh-d2-26.txt ##########"
D2ISO=$(mktemp -d /tmp/hdk-d2-26.XXXXXX)
HUAWEICLOUD_HOME="$D2ISO" node D2-26/probe.mjs > fresh-d2-26.txt 2>&1; echo "exit=$?"

echo; echo "ALL SOURCE-LEVEL PROBES DONE $(date '+%H:%M:%S')"