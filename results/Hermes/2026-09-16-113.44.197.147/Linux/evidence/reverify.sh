#!/usr/bin/env bash
# 每日测试执行 runner — Hermes / Linux / v1.1.5 (fresh re-verify)
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
export HDK_PLUGIN_SRC="/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core"
export HDK_MCP_SERVER="/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"
export EVID_DIR="/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-16-113.44.197.147/Linux/evidence"

cd "$EVID_DIR"
echo "=== SUT ==="; huaweicloud-devkit version 2>&1 | head -2
echo "=== HDK HEAD ==="; git -C /home/testbot1/devkit-test/Hermes/hdk log --oneline -1

run() {
  echo; echo "########## $1 ##########"
  node "$1" > "fresh-$2.txt" 2>&1
  echo "exit=$?"
}

run probe-security.mjs security
run probe-supplement2.mjs supplement2
run probe-remaining.mjs remaining
run probe-final.mjs final
run probe-d1-41.mjs d1-41
run probe-tools.mjs tools
run probe-matrix.mjs matrix
run probe-protocol.mjs protocol
run probe-supplement.mjs supplement

echo; echo "########## probe-cli.sh ##########"
bash probe-cli.sh > fresh-cli.txt 2>&1
echo "exit=$?"

echo; echo "########## probe-hook.sh ##########"
bash probe-hook.sh > fresh-hook.txt 2>&1
echo "exit=$?"

echo; echo "########## probe-d158.sh ##########"
bash probe-d158.sh > fresh-d158.txt 2>&1
echo "exit=$?"

echo; echo "ALL PROBES DONE"