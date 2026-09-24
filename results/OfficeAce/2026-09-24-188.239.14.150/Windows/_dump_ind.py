import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
for cid in sorted(os.listdir(ev)):
    p = os.path.join(ev, cid)
    if not os.path.isdir(p):
        continue
    sp = os.path.join(p, 'stdout.log')
    if not os.path.isfile(sp):
        continue
    raw = open(sp, encoding='utf-8-sig').read()
    try:
        j = json.loads(raw)
    except Exception:
        print(f'===== {cid} (non-json) =====\n{raw[:400]}\n')
        continue
    # only print individual case dirs (status dict), skip grouped dirs
    if isinstance(j, dict) and ('status' in j or 'pass' in j) and 'results' not in j:
        print(f'===== {cid} =====')
        print(json.dumps(j, ensure_ascii=False))