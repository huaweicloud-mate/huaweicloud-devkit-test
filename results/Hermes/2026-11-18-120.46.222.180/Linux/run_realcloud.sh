#!/usr/bin/env bash
# Hermes Linux 2026-10-26 真云阶段顺序执行（避免 profile 切换竞态，串行）
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
BASE="$(cd "$(dirname "$0")" && pwd)"

echo "########## [1] realcloud-probe (D2-1/D3-C4/D4-14/18/19/20 + EXP-C4-01..22) ########## $(date '+%F %T')"
cd "$BASE/evidence/realcloud-probe" && timeout 600 node probe.mjs > stdout.txt 2>&1
echo "realcloud-probe exit=$? $(date '+%F %T')"
tail -3 stdout.txt

echo ""
echo "########## [2] heavy E2E (D3-C7/C2/C3/C6/C1) ########## $(date '+%F %T')"
cd "$BASE"
bash heavy_run.sh

echo ""
echo "########## [3] aux (D4-13/23/24, D1-70) ########## $(date '+%F %T')"
bash aux_run.sh

echo ""
echo "ALL REALCLOUD DONE $(date '+%F %T')"