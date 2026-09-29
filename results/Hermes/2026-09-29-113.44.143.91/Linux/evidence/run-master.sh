#!/usr/bin/env bash
# 每日测试 master runner — Hermes / Linux / v1.1.7 / 2026-09-29
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$HOME/.local/bin:$PATH"
export HDK_PLUGIN_SRC="/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core"
export HDK_MCP_SERVER="/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"
export EVID="/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-29-113.44.143.91/Linux/evidence"
export EVID_DIR="$EVID"
export HDK_REGION="cn-north-4"

cd "$EVID"
echo "=== SUT ==="; huaweicloud-devkit version 2>&1 | head -2
echo "=== HDK HEAD ==="; git -C /home/zhangshuang/devkit-test/Hermes/hdk log --oneline -1
echo "=== 时间戳 $(date '+%Y-%m-%d %H:%M:%S %Z') ==="

run_node() {
  echo; echo "########## node $1 -> fresh-$2.txt ##########"
  ( node "$1" > "fresh-$2.txt" 2>&1 ); echo "exit=$?"
}

# --- 5 grouped probes (自写 stdout.log) ---
run_node d4-security/probe.mjs d4-security
run_node d2-auth/probe.mjs d2-auth
run_node d1-upgrade/probe.mjs d1-upgrade
run_node mcp-tools/probe.mjs mcp-tools
run_node c4-service-matrix/probe.mjs c4-service-matrix

# --- 顶层源码级探针 (写 per-case stdout.txt) ---
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

# --- 顶层 shell/python 探针 ---
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

# --- 独立 per-case 探针 ---
echo; echo "########## D2-26 备份恢复 (HUAWEICLOUD_HOME 隔离) ##########"
( HUAWEICLOUD_HOME=$(mktemp -d) node D2-26/probe.mjs > fresh-d2-26.txt 2>&1 ); echo "exit=$?"
echo; echo "########## D4-27 双路径脱敏 ##########"
( node D4-27/probe.mjs > fresh-d4-27.txt 2>&1 ); echo "exit=$?"
for d in D3-S2 D3-S6 D4-13; do
  echo; echo "########## $d/probe.mjs ##########"
  ( node "$d/probe.mjs" > "fresh-${d}.txt" 2>&1 ); echo "exit=$?"
done

# --- D10-3 eval harness (EXP-E01~E15 路由) ---
echo; echo "########## run-eval.mjs -> eval-harness.txt ##########"
( node /home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/eval/harness/run-eval.mjs "$HDK_MCP_SERVER" > eval-harness.txt 2>&1 ); echo "exit=$?"

# --- 协议探针 (D9 协议) ---
echo; echo "########## protocol-probe.mjs -> protocol-probe.txt ##########"
( node /home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/eval/harness/protocol-probe.mjs "$HDK_MCP_SERVER" > protocol-probe.txt 2>&1 ); echo "exit=$?"

# --- 真云 E2E (建删资源归零) ---
echo; echo "########## realcloud-s3-d414.mjs (D3-S3 沙箱预览 + D4-14 VPC建删+CTS) ##########"
( node realcloud-s3-d414.mjs > fresh-realcloud-s3-d414.txt 2>&1 ); echo "exit=$?"
echo; echo "########## realcloud-newcases.mjs ##########"
( node realcloud-newcases.mjs > fresh-realcloud-newcases.txt 2>&1 ); echo "exit=$?"

echo; echo "ALL PROBES DONE $(date '+%H:%M:%S')"