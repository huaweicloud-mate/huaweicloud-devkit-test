#!/usr/bin/env bash
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
BASE="$(cd "$(dirname "$0")" && pwd)"
HDK="/home/zhangshuang/devkit-test/OpenCode/hdk"
SRC="$HDK/plugins/huaweicloud-core/src"

echo "########## D4-13 只读子账号 ########## $(date '+%F %T')"
cd "$BASE/evidence/D4-13" && node probe.mjs > stdout.txt 2>&1; echo "exit=$?"
python3 - "$PWD/stdout.txt" <<'PY'
import json,os,sys
p=sys.argv[1]; t=open(p,encoding='utf-8',errors='replace').read()
i=t.rfind('{')
try:
    d=json.loads(t[i:]) if i>=0 else {}
    s="PASS" if (d.get("writeDenied")==True and d.get("residualZero")==True) else "FAIL"
    print("SUMMARY readPassRate=%s writeDenied=%s residualZero=%s -> %s"%(d.get("readPassRate"),d.get("writeDenied"),d.get("residualZero"),s))
except Exception as e:
    print("parse err",e); s="FAIL"
import json as j
open("stdout.log","w",encoding="utf-8").write(j.dumps({"status":s,"executedAt":__import__("time").strftime("%Y%m%d%H%M%S")},ensure_ascii=False))
PY

echo "########## D4-23 全局规则 ########## $(date '+%F %T')"
cd "$BASE/evidence/D4-23" && node probe.mjs "$HDK" > stdout.txt 2>&1; echo "exit=$?"
python3 - "$PWD/stdout.txt" <<'PY'
import json,sys,time
t=open(sys.argv[1],encoding='utf-8',errors='replace').read()
lo=t.lower()
ok = ('verdict' in lo or 'pass' in lo) and ('fail' not in lo or 'pass' in lo)
s="PASS" if (('"status":"PASS"' in t) or ('verdict":"PASS"' in t) or ('PASS' in t and 'FAIL' not in t)) else "FAIL"
open("stdout.log","w",encoding="utf-8").write(json.dumps({"status":s,"executedAt":time.strftime("%Y%m%d%H%M%S")},ensure_ascii=False))
print("tail:", t.strip().splitlines()[-1] if t.strip() else "(empty)")
PY

echo "########## D4-24 确认令牌边界 ########## $(date '+%F %T')"
cd "$BASE/evidence/D4-24" && node probe.mjs "$SRC" > stdout.txt 2>&1; echo "exit=$?"
python3 - "$PWD/stdout.txt" <<'PY'
import json,sys,time
t=open(sys.argv[1],encoding='utf-8',errors='replace').read()
s="PASS" if ('"status":"PASS"' in t or ('PASS' in t and 'FAIL' not in t)) else "FAIL"
open("stdout.log","w",encoding="utf-8").write(json.dumps({"status":s,"executedAt":time.strftime("%Y%m%d%H%M%S")},ensure_ascii=False))
print("tail:", t.strip().splitlines()[-1] if t.strip() else "(empty)")
PY

echo "########## D1-70 代理配置 ########## $(date '+%F %T')"
cd "$BASE/evidence/D1-70" && node probe.mjs "$SRC" > stdout.txt 2>&1; echo "exit=$?"
python3 - "$PWD/stdout.txt" <<'PY'
import json,sys,time
t=open(sys.argv[1],encoding='utf-8',errors='replace').read()
s="PASS" if ('"status":"PASS"' in t or ('PASS' in t and 'FAIL' not in t)) else "FAIL"
open("stdout.log","w",encoding="utf-8").write(json.dumps({"status":s,"executedAt":time.strftime("%Y%m%d%H%M%S")},ensure_ascii=False))
print("tail:", t.strip().splitlines()[-1] if t.strip() else "(empty)")
PY

echo "AUX DONE $(date '+%F %T')"