#!/usr/bin/env bash
# 每 10 分钟增量提报（含 rebase 处理多 agent 并发推进 main）
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
REPO="/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test"
cd "$REPO" || exit 1
while true; do
  git fetch origin main >/dev/null 2>&1
  git rebase --abort >/dev/null 2>&1
  git rebase origin/main >/dev/null 2>&1 && echo "[$(date '+%F %T')] rebase ok" || echo "[$(date '+%F %T')] rebase skip"
  python3 scripts/hourly_sync.py Hermes Linux
  sleep 600
done