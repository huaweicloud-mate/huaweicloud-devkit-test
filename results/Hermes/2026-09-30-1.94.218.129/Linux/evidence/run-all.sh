#!/usr/bin/env bash
# Hermes daily test — v1.1.8-next.1 — full fresh run (2026-09-30)
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$HOME/.local/bin:$PATH"
export HDK_PLUGIN_SRC="/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core"
export HDK_MCP_SERVER="/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"
export EVID="/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-30-1.94.218.129/Linux/evidence"
export EVID_DIR="$EVID"
export HDK_REGION="cn-north-4"

echo "=== SUT ==="; huaweicloud-devkit version 2>&1 | head -2
echo "=== HDK HEAD ==="; git -C /home/testbot3/devkit-test/Hermes/hdk log --oneline -1
echo "=== 时间戳 $(date '+%Y-%m-%d %H:%M:%S %Z') ==="

cd "$EVID"

# --- D9-12/13 协议安全基线 (先跑) ---
echo; echo "########## probe-d9-1213.mjs -> d9-1213-probe.out.txt ##########"
( node probe-d9-1213.mjs > d9-1213-probe.out.txt 2>&1 ); echo "exit=$?"

# --- 主 runner 全部 ---
bash run-master.sh 2>&1 || echo "run-master.sh had non-zero exit (inner subshells are isolated)"

echo "ALL PROBES DONE $(date '+%H:%M:%S')"