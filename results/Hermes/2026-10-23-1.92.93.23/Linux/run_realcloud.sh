#!/usr/bin/env bash
# Hermes Linux 2026-10-23 每日测试 —— 真云阶段（v1.1.12）：真机建删资源归零
set -u
export PATH="/home/zhangshuang/nodejs/bin:/home/zhangshuang/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/zhangshuang/.local/bin"

BASE="$(cd "$(dirname "$0")" && pwd)"
P="$BASE/evidence/_probes"
RL_E2E="/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/scripts/realcloud_e2e.mjs"
export HDK_SRC="/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src" HDK_REGION="cn-north-4"

echo "===== [36] realcloud-probe (D2-1/D3-C4/D4-14/D4-18/19/20) ===== $(date '+%F %T')"
cd "$BASE/evidence/realcloud-probe"
node probe.mjs > stdout.txt 2>&1; echo "exit=$?"; grep -c "OK\]\|FAIL\]\|verdict\|PASS" stdout.txt

echo "===== [37] D4-13 只读子账号最小权限 ===== $(date '+%F %T')"
cd "$BASE/evidence/D4-13"
node probe.mjs > stdout.txt 2>&1; echo "exit=$?"; tail -6 stdout.txt

echo "===== [39] D3-C1 ECS 生命周期真云 E2E ===== $(date '+%F %T')"
cd "$P"
HDK_REGION=cn-north-4 node "$RL_E2E" --case=D3-C1 > d3-c1.log 2>&1; echo "exit=$?"; tail -8 d3-c1.log

echo "===== [40] D3-C2 OBS 静态站部署真云 E2E ===== $(date '+%F %T')"
cd "$P"
HDK_REGION=cn-north-4 node "$RL_E2E" --case=D3-C2 > d3-c2.log 2>&1; echo "exit=$?"; tail -6 d3-c2.log

echo "===== [41] D3-C6 沙箱 7 隐式工具冒烟真云 ===== $(date '+%F %T')"
cd "$P"
node "$RL_E2E" --case=D3-C6 > d3-c6.log 2>&1; echo "exit=$?"; tail -6 d3-c6.log

echo "===== [42] D3-C3 沙箱部署 E2E 真云 ===== $(date '+%F %T')"
cd "$P"
node "$RL_E2E" --case=D3-C3 > d3-c3.log 2>&1; echo "exit=$?"; tail -6 d3-c3.log

echo "===== [43] D3-C7 跨区域资源操作引导真云 ===== $(date '+%F %T')"
cd "$P"
node D3-C7-probe.mjs > d3-c7.log 2>&1; echo "exit=$?"; tail -8 d3-c7.log

echo "===== REALCLOUD PHASE DONE ===== $(date '+%F %T')"