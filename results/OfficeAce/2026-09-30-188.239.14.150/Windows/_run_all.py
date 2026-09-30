import os, subprocess, json, sys, io

HERE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(HERE, 'evidence')

valid = {'PASS','FAIL','BLOCKED','SPEC-MISMATCH','NOT_RUN'}

def run_case(cid):
    d = os.path.join(EVID, cid)
    probe = os.path.join(d, 'probe.mjs')
    if not os.path.exists(probe):
        return ('NO_PROBE', None, None)
    try:
        p = subprocess.run(['node', 'probe.mjs'], cwd=d, capture_output=True, text=True, encoding='utf-8', timeout=180)
    except subprocess.TimeoutExpired:
        return ('TIMEOUT', None, None)
    out = (p.stdout or '').strip()
    err = (p.stderr or '').strip()
    # write stdout.log (raw) and stderr
    with open(os.path.join(d, 'stdout.log'), 'w', encoding='utf-8') as f:
        f.write(out + ('\n' if out else ''))
    if err:
        with open(os.path.join(d, 'stderr.log'), 'w', encoding='utf-8') as f:
            f.write(err + '\n')
    # try parse
    st = None
    why = None
    if out:
        try:
            j = json.loads(out)
            if isinstance(j, dict) and j.get('status') in valid:
                st = j['status']
                why = j.get('why')
        except Exception:
            pass
    return (st or 'NO_STATUS', why, (out[:160], err[:160]))

if __name__ == '__main__':
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    dirs = sorted(os.listdir(EVID))
    results = []
    for cid in dirs:
        d = os.path.join(EVID, cid)
        if not os.path.isdir(d):
            continue
        probe = os.path.join(d, 'probe.mjs')
        if not os.path.exists(probe):
            continue
        has_stdout = os.path.exists(os.path.join(d, 'stdout.log'))
        if only:
            if cid not in only:
                continue
        # skip those already having stdout (they were run before) unless forced re-run
        st, why, tail = run_case(cid)
        results.append((cid, st, why, tail))
    print('==== RESULT ====')
    from collections import Counter
    c = Counter(r[1] for r in results)
    print(c)
    for cid, st, why, tail in results:
        print(f'{cid:16s} {st:14s} {why or ""}')
        if st not in valid or st == 'NO_STATUS':
            print('    tail:', tail)