#!/usr/bin/env bash
# 重跑 v2 版本测试失败批（修复适配后用 node v26 + dist 路径）
set -u
export PATH="/home/testbot2/.local/bin:/home/testbot2/nodejs/bin:/home/testbot2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

P="/home/testbot2/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-27-1.94.193.150-v2full/Linux/evidence/_probes"
SRC="/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist"
MCP="$SRC/mcp-server.js"
HDK="/home/testbot2/devkit-test/Hermes/hdk"

cd "$P"
echo "node = $(node --version)"

echo "===== [25] new-config (D2-27/D1-70/D8-9/D8-10/D6-9) ====="
node new-config-probe.mjs > new-config.log 2>&1; echo "exit=$?"; grep -cE "CASE|check\(|\[FAIL\]|\[OK\]" new-config.log

echo "===== [26] new-safety (D10-4/D4-26/D4-29/D4-28/D4-25) ====="
node new-safety-probe.mjs > new-safety.log 2>&1; echo "exit=$?"; grep -cE "CASE|check\(|\[FAIL\]|\[OK\]" new-safety.log

echo "===== [27] new-mcp (D9-10/D9-11) ====="
node new-mcp-probe.mjs > new-mcp.log 2>&1; echo "exit=$?"; grep -cE "CASE|check\(|\[FAIL\]|\[OK\]" new-mcp.log

echo "===== [28] new-cli (D1-69) ====="
node new-cli-probe.mjs > new-cli.log 2>&1; echo "exit=$?"; grep -cE "CASE|check\(|\[FAIL\]|\[OK\]" new-cli.log

echo "===== [29] new-scenario (D3-S1/S5/S8) ====="
node new-scenario-probe.mjs > new-scenario.log 2>&1; echo "exit=$?"; grep -cE "CASE|check\(|\[FAIL\]|\[OK\]" new-scenario.log

echo "===== [30] new-cloud (D3-S2/C13/C14/S4/S3) ====="
node new-cloud-probe.mjs > new-cloud.log 2>&1; echo "exit=$?"; grep -cE "CASE|check\(|\[FAIL\]|\[OK\]" new-cloud.log

echo "===== [31] new-fg-rds (D3-S6/S7) ====="
node new-fg-rds-probe.mjs > new-fg-rds.log 2>&1; echo "exit=$?"; grep -cE "CASE|check\(|\[FAIL\]|\[OK\]" new-fg-rds.log

echo "===== RERUN DONE ===== $(date '+%F %T')"