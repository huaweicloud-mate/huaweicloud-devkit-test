#!/usr/bin/env bash
# 真云 E2E 执行 runner — Hermes / Linux / 2026-09-26 (fresh 全量真机执行)
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
export HDK_PLUGIN_SRC="/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core"
export HDK_MCP_SERVER="/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"
export EVID_DIR="/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-26-113.44.197.147/Linux/evidence"
export HDK_REGION="cn-north-4"
REPO="/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test"
cd "$EVID_DIR"

echo "=== SUT ==="; huaweicloud-devkit version 2>&1 | head -2
echo "=== HDK HEAD ==="; git -C /home/testbot1/devkit-test/Hermes/hdk log --oneline -1
echo "=== 时间戳 $(date '+%Y-%m-%d %H:%M:%S %Z') ==="

# D4-13 只读子账号最小权限 (run-as-readonly.py 注入只读凭证)
echo; echo "########## D4-13 (只读子账号) ##########"
python3 "$REPO/scripts/run-as-readonly.py" node D4-13/probe.mjs 2>&1 | tail -30
echo "exit=$?"

# D3-S1 / D3-S2 / D3-C13 / D3-S4 (realcloud-newcases.mjs)
echo; echo "########## realcloud-newcases.mjs (D3-S1/S2/C13/S4) ##########"
node realcloud-newcases.mjs 2>&1 | tail -30
echo "exit=$?"

# D3-S2 修正版 (全量 ListVpcs 校验)
echo; echo "########## D3-S2/probe.mjs (全量 ListVpcs) ##########"
node D3-S2/probe.mjs 2>&1 | tail -25
echo "exit=$?"

# D3-S3 / D4-14 (realcloud-s3-d414.mjs)
echo; echo "########## realcloud-s3-d414.mjs (D3-S3/D4-14) ##########"
node realcloud-s3-d414.mjs 2>&1 | tail -40
echo "exit=$?"

# D3-S6 FunctionGraph 定时任务
echo; echo "########## D3-S6/probe.mjs (FunctionGraph) ##########"
node D3-S6/probe.mjs 2>&1 | tail -25
echo "exit=$?"

echo; echo "ALL REALCLOUD E2E DONE $(date '+%H:%M:%S')"