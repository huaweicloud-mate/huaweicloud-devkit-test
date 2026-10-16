#!/usr/bin/env bash
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
BASE="$(cd "$(dirname "$0")" && pwd)"
for c in D3-C7 D3-C2 D3-C3 D3-C6 D3-C1; do
  echo "########## $c ########## $(date '+%F %T')"
  cd "$BASE/evidence/$c" && timeout 900 node probe.mjs
  echo "########## $c done exit=$? ########## $(date '+%F %T')"
done
echo "ALL HEAVY DONE $(date '+%F %T')"