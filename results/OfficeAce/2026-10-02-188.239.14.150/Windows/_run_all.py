import os, subprocess, json, sys, io, time

HERE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(HERE, 'evidence')
VALID = {'PASS','FAIL','BLOCKED','SPEC-MISMATCH','NOT_RUN'}

def run_case(cid):
    d = os.path.join(EVID, cid)
    probe = os.path.join(d, 'probe.mjs')
    if not os.path.isfile(probe):
        return {'cid': cid, 'status': 'NO_PROBE', 'why': None}
    t0 = time.time()
    try:
        p = subprocess.run(['node', 'probe.mjs'], cwd=d,
                           capture_output=True, text=True, encoding='utf-8',
                           errors='replace', timeout=240)
    except subprocess.TimeoutExpired:
        return {'cid': cid, 'status': 'TIMEOUT', 'why': None, 'sec': round(time.time()-t0)}
    out = (p.stdout or '').strip()
    err = (p.stderr or '').strip()
    # write raw logs
    with open(os.path.join(d, 'stdout.log'), 'w', encoding='utf-8') as f:
        f.write(out + ('\n' if out else ''))
    if err:
        with open(os.path.join(d, 'stderr.log'), 'w', encoding='utf-8') as f:
            f.write(err + '\n')
    # parse status from stdout
    st = 'NO_STATUS'; why = None
    if out:
        # try direct JSON
        try:
            j = json.loads(out)
            if isinstance(j, dict):
                s = j.get('status') or j.get('verdict') or j.get('result')
                if s in VALID:
                    st = s
                elif isinstance(j.get('summary'), str) and j['summary'] in VALID:
                    st = j['summary']
                why = j.get('why') or j.get('reason')
                # nested results
                if st == 'NO_STATUS' and isinstance(j.get('results'), list):
                    pass
        except Exception:
            pass
        if st == 'NO_STATUS':
            # scrape status token inside output
            import re
            for tok in VALID:
                if re.search(r'["\']?(?:status|verdict|result|summary)["\']?\s*[:=]\s*["\']?'+tok, out):
                    st = tok; break
    rc = p.returncode
    if st == 'NO_STATUS':
        # infer from rc if nothing parseable
        if rc == 0 and out:
            st = 'PASS'
    return {'cid': cid, 'status': st, 'why': why, 'rc': rc,
            'sec': round(time.time()-t0, 1),
            'tail': (out[:140] + ' | ' + err[:140]) if st not in VALID else None}

only = sys.argv[1:] if len(sys.argv) > 1 else None
dirs = sorted([x for x in os.listdir(EVID) if os.path.isdir(os.path.join(EVID, x))])
results = []
for i, cid in enumerate(dirs, 1):
    if only and cid not in only:
        continue
    r = run_case(cid)
    results.append(r)
    print(f"[{i}/{len(dirs)}] {cid:16s} {r['status']:14s} {r.get('why') or ''}", flush=True)
    if r.get('tail'):
        print('      tail:', r['tail'])

from collections import Counter
c = Counter(r['status'] for r in results)
summary = {'counts': dict(c), 'results': results}
with open(os.path.join(HERE, '_run_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(summary, f, ensure_ascii=False, indent=1)
print('==== SUMMARY ====')
print(json.dumps(c, ensure_ascii=False))