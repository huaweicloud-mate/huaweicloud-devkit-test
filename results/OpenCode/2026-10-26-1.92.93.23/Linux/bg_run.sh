#!/usr/bin/env bash
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
BASE="$(cd "$(dirname "$0")" && pwd)"
EV="$BASE/evidence"
HDK="/home/zhangshuang/devkit-test/OpenCode/hdk"
SRC="$HDK/plugins/huaweicloud-core/src"
LOG=/tmp/bg_run.log
: > "$LOG"
echo "BG START $(date '+%F %T')" >> "$LOG"

echo "===== A. realcloud-probe (D2-1/D3-C4/D4-14/18/19/20 + EXP-C4-*) =====" >> "$LOG"
cd "$EV/realcloud-probe" && timeout 480 node probe.mjs > stdout.txt 2>&1
echo "realcloud exit=$?" >> "$LOG"

echo "===== B. heavy (D3-C1/2/3/6/7) =====" >> "$LOG"
for c in D3-C7 D3-C2 D3-C3 D3-C6 D3-C1; do
  echo "##### $c start $(date '+%F %T')" >> "$LOG"
  cd "$EV/$c" && timeout 900 node probe.mjs >> "$LOG" 2>&1
  echo "##### $c done exit=$? $(date '+%F %T')" >> "$LOG"
done

echo "===== C. aux (D4-13/23/24/D1-70) =====" >> "$LOG"

echo "##### D4-13 start $(date '+%F %T')" >> "$LOG"
cd "$EV/D4-13" && node probe.mjs > stdout.txt 2>&1; echo "D4-13 exit=$?" >> "$LOG"
python3 - "$PWD/stdout.txt" <<'PY' >> "$LOG" 2>&1
import json,sys,time
t=open(sys.argv[1],encoding='utf-8',errors='replace').read()
i=t.rfind('{')
try:
    d=json.loads(t[i:]) if i>=0 else {}
    s="PASS" if (d.get("writeDenied")==True and d.get("residualZero")==True) else "FAIL"
except Exception as e:
    s="FAIL"
open("stdout.log","w",encoding="utf-8").write(json.dumps({"status":s,"executedAt":time.strftime("%Y%m%d%H%M%S")},ensure_ascii=False))
print("D4-13 ->",s)
PY

echo "##### D4-23 start $(date '+%F %T')" >> "$LOG"
cd "$EV/D4-23" && node probe.mjs "$HDK" > stdout.txt 2>&1; echo "D4-23 exit=$?" >> "$LOG"
python3 - "$PWD/stdout.txt" <<'PY' >> "$LOG" 2>&1
import json,sys,time
t=open(sys.argv[1],encoding='utf-8',errors='replace').read()
s="PASS" if ('PASS' in t and 'FAIL' not in t) else "FAIL"
open("stdout.log","w",encoding="utf-8").write(json.dumps({"status":s,"executedAt":time.strftime("%Y%m%d%H%M%S")},ensure_ascii=False))
print("D4-23 ->",s)
PY

echo "##### D4-24 start $(date '+%F %T')" >> "$LOG"
cd "$EV/D4-24" && node probe.mjs "$SRC" > stdout.txt 2>&1; echo "D4-24 exit=$?" >> "$LOG"
python3 - "$PWD/stdout.txt" <<'PY' >> "$LOG" 2>&1
import json,sys,time
t=open(sys.argv[1],encoding='utf-8',errors='replace').read()
s="PASS" if ('PASS' in t and 'FAIL' not in t) else "FAIL"
open("stdout.log","w",encoding="utf-8").write(json.dumps({"status":s,"executedAt":time.strftime("%Y%m%d%H%M%S")},ensure_ascii=False))
print("D4-24 ->",s)
PY

echo "##### D1-70 start $(date '+%F %T')" >> "$LOG"
cd "$EV/D1-70" && node probe.mjs "$SRC" > stdout.txt 2>&1; echo "D1-70 exit=$?" >> "$LOG"
python3 - "$PWD/stdout.txt" <<'PY' >> "$LOG" 2>&1
import json,sys,time
t=open(sys.argv[1],encoding='utf-8',errors='replace').read()
s="PASS" if ('PASS' in t and 'FAIL' not in t) else "FAIL"
open("stdout.log","w",encoding="utf-8").write(json.dumps({"status":s,"executedAt":time.strftime("%Y%m%d%H%M%S")},ensure_ascii=False))
print("D1-70 ->",s)
PY

echo "BG ALL DONE $(date '+%F %T')" >> "$LOG"