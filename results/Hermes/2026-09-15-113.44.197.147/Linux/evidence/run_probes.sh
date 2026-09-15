#!/usr/bin/env bash
# 每日测试执行 runner — Hermes / Linux / v1.1.4@9b67256
# 重跑 11 支探针，证据落盘 evidence/<case-id>/stdout.txt + 探针级 stdout 文件
set -uo pipefail
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
export HDK_PLUGIN_SRC="/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core"
export HDK_MCP_SERVER="/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"
export EVID_DIR="/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-15-113.44.197.147/Linux/evidence"

cd "$EVID_DIR"
echo "=== SUT ==="; huaweicloud-devkit version 2>&1 | head -2
echo "=== HDK HEAD ==="; git -C /home/testbot1/devkit-test/Hermes/hdk log --oneline -1

echo; echo "########## 1. probe-security.mjs ##########"
node probe-security.mjs > security-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 2. probe-remaining.mjs ##########"
node probe-remaining.mjs > remaining-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 3. probe-final.mjs ##########"
node probe-final.mjs > final-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 4. probe-d1-41.mjs ##########"
node probe-d1-41.mjs > d1-41-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 5. probe-tools.mjs ##########"
node probe-tools.mjs > tools-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 6. probe-matrix.mjs ##########"
node probe-matrix.mjs > matrix-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 7. probe-protocol.mjs ##########"
node probe-protocol.mjs > protocol-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 8. probe-supplement.mjs ##########"
node probe-supplement.mjs > supplement-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 9. probe-cli.sh ##########"
bash probe-cli.sh > cli-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 10. probe-hook.sh ##########"
bash probe-hook.sh > hook-stdout.txt 2>&1
echo "exit=$?"

echo; echo "########## 11. probe-d158.sh ##########"
bash probe-d158.sh > d158-stdout.txt 2>&1
echo "exit=$?"

echo; echo "ALL PROBES DONE"