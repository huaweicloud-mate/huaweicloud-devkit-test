# -*- coding: utf-8 -*-
import glob, io, json, os
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, "evidence")

for p in sorted(glob.glob(os.path.join(ev, "*", "stdout.log"))):
    cdir = os.path.basename(os.path.dirname(p))
    raw = io.open(p, encoding="utf-8-sig").read().strip()
    try:
        j = json.loads(raw)
    except Exception:
        continue
    if "results" not in j:
        continue
    fails = [r for r in j["results"] if isinstance(r, dict) and not r.get("pass")]
    print("=" * 70)
    print(f"AGGREGATE: {cdir}  total={j.get('total')} passed={j.get('passed')} failed={j.get('failed')}")
    for r in fails:
        print(f"  [FAIL] id={r.get('id')} name={r.get('name')} expected={r.get('expected')!r} actual={r.get('actual')!r}")
        print(f"         passMsg={r.get('passMsg')!r} failMsg={r.get('failMsg')!r}")