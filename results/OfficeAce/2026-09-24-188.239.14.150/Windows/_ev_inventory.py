# -*- coding: utf-8 -*-
import glob, io, json, os
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, "evidence")
dirs = sorted(os.listdir(ev))
print("evidence dirs count:", len(dirs))
for d in dirs:
    p = os.path.join(ev, d, "stdout.log")
    if not os.path.isfile(p):
        print(f"[NO stdout.log] {d}")
        continue
    raw = io.open(p, encoding="utf-8-sig").read().strip()
    try:
        j = json.loads(raw)
        if isinstance(j, dict):
            if "results" in j:
                kind = f"AGGREGATE total={j.get('total')} passed={j.get('passed')} failed={j.get('failed')}"
            elif "status" in j:
                kind = f"SINGLE status={j.get('status')}"
            else:
                kind = "DICT keys=" + ",".join(list(j.keys())[:6])
        else:
            kind = "NOTDICT"
    except Exception as e:
        kind = "NONJSON"
    print(f"[{kind}] {d}  (len={len(raw)})")