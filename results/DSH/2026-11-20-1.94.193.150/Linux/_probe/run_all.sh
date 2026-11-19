#!/bin/bash
cd "$(dirname "$0")/.."
export PATH=$HOME/nodejs/bin:$HOME/bin:$HOME/.local/bin:$PATH
LOG=_run.log
: > "$LOG"
while read -r id; do
  [ -z "$id" ] && continue
  [ -f "evidence/$id/probe.mjs" ] || { echo "$(date '+%H:%M:%S') $id MISSING_PROBE" >> "$LOG"; continue; }
  start=$(date +%s)
  timeout 900 node "evidence/$id/probe.mjs" > "evidence/$id/stdout.run.log" 2>&1
  rc=$?
  st=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('evidence/$id/stdout.log','utf8')).status)}catch(e){console.log('NOLOG')}" 2>/dev/null)
  echo "$(date '+%H:%M:%S') $id rc=$rc status=$st elapsed=$(( $(date +%s) - start ))s" >> "$LOG"
done < _probe/order.txt
echo "RUNNER_DONE $(date '+%H:%M:%S')" >> "$LOG"
