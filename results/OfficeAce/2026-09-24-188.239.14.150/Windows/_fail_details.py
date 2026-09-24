# -*- coding: utf-8 -*-
import glob, io, json, os

base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, "evidence")

for p in sorted(glob.glob(os.path.join(ev, "*", "stdout.log"))):
    cdir = os.path.basename(os.path.dirname(p))
    raw = io.open(p, encoding="utf-8-sig").read().strip()
    if not raw:
        print(f"--- {cdir}: EMPTY")
        continue
    try:
        j = json.loads(raw)
    except Exception:
        print(f"--- {cdir}: NONJSON")
        continue
    if "status" in j:
        print(f"--- {cdir}: SINGLE status={j['status']} why={j.get('why','')[:80]}")
        continue
    if "results" in j:
        fails = [r for r in j["results"] if isinstance(r, dict) and not r.get("pass")]
        print(f"--- {cdir}: total={j.get('total')} passed={j.get('passed')} failed={j.get('failed')}")
        for r in fails:
            print(f"    [FAIL] id={r.get('id')} name={r.get('name')} expected={r.get('expected')!r} actual={r.get('actual')!r}")
        continue
    print(f"--- {cdir}: KEYS={list(j.keys())}")