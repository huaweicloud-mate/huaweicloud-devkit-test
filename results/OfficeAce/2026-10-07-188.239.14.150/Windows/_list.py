# -*- coding: utf-8 -*-
import os, json
ev = "evidence"
ids = []
for d in sorted(os.listdir(ev)):
    p = os.path.join(ev, d, "stdout.log")
    if os.path.isfile(p):
        try:
            j = json.load(open(p, encoding="utf-8"))
            st = j.get("status") if isinstance(j, dict) else "?"
        except Exception:
            st = "?"
        ids.append((d, st))
print("total stdout cases:", len(ids))
for d, st in ids:
    print(d, st)