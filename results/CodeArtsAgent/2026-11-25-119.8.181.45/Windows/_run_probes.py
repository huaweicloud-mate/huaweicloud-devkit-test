import os, sys, json, subprocess, time, concurrent.futures
BASE = os.path.dirname(os.path.abspath(__file__))
EV = os.path.join(BASE, 'evidence')
SKIP = set(sys.argv[1].split(',')) if len(sys.argv) > 1 and sys.argv[1] else set()
only = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else None
ids = sorted(d for d in os.listdir(EV) if os.path.exists(os.path.join(EV, d, 'probe.mjs')))
if only: ids = [i for i in ids if i in only]
ids = [i for i in ids if i not in SKIP]
print('to run', len(ids), flush=True)
def run(i):
    p = os.path.join(EV, i, 'probe.mjs')
    out = os.path.join(EV, i, 'stdout.log'); err = os.path.join(EV, i, 'stderr.log')
    t0 = time.time()
    try:
        with open(out, 'w', encoding='utf-8', errors='replace') as fo, open(err, 'w', encoding='utf-8', errors='replace') as fe:
            r = subprocess.run(['node', p], stdout=fo, stderr=fe, timeout=300)
        rc = r.returncode
    except subprocess.TimeoutExpired:
        rc = 'TIMEOUT'
    except Exception as e:
        rc = 'ERR:' + str(e)
    st = ''
    try:
        j = json.load(open(out, encoding='utf-8', errors='replace')); st = j.get('status', '')
    except Exception:
        st = 'NOJSON'
    return i, rc, st, round(time.time()-t0, 1)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
    for i, rc, st, dt in ex.map(run, ids):
        print(f'{i}\t{st}\trc={rc}\t{dt}s', flush=True)
