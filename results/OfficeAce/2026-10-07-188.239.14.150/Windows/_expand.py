# -*- coding: utf-8 -*-
import os, json, datetime
BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
GROUPS = ["d4-security", "d2-auth", "d1-upgrade", "mcp-tools", "c4-service-matrix"]
NOW = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

cases = {}
for g in GROUPS:
    p = os.path.join(EVID, g, "stdout.log")
    if not os.path.isfile(p):
        print("skip missing", g)
        continue
    data = json.load(open(p, encoding="utf-8"))
    for r in data.get("results", []):
        cid = r.get("id")
        if not cid:
            continue
        cases.setdefault(cid, []).append((g, r))

written = 0
for cid, entries in cases.items():
    fails = [(g, r) for g, r in entries if not r.get("pass")]
    if fails:
        status = "FAIL"
        why = " | ".join("{}:{}".format(g, r.get('name')) for g, r in fails)
    else:
        status = "PASS"
        why = "grouped probe all assertions pass"
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    out = {"status": status, "why": why[:200], "executedAt": NOW}
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    written += 1

print("expanded", written, "per-case stdout.log; evidence dirs total:", len(os.listdir(EVID)))