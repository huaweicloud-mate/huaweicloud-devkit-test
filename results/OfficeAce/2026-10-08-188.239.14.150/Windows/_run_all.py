# -*- coding: utf-8 -*-
import os, subprocess, json, sys, io, time, re

HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
EVID = os.path.join(HERE, 'evidence')
HDK_SRC = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src'
VALID = {'PASS','FAIL','BLOCKED','SPEC-MISMATCH','NOT_RUN'}

# Fixture-style cases: need SUT path arg + emit text "RESULT: PASS/FAIL" (not JSON status)
FIXTURE_IDS = {'D1-66','D1-69','D2-10','D2-13','D2-27','D3-C14','D4-12','D4-29',
               'D9-9','D8-10','D9-6','D9-10','D9-11'}

def nowts():
    return time.strftime('%Y%m%d%H%M%S', time.localtime())

def run_case(cid):
    d = os.path.join(EVID, cid)
    probe = os.path.join(d, 'probe.mjs')
    if not os.path.isfile(probe):
        return {'cid': cid, 'status': 'NO_PROBE', 'why': None}
    t0 = time.time()
    if cid in FIXTURE_IDS:
        cmd = ['node', 'probe.mjs', HDK_SRC]
    else:
        cmd = ['node', 'probe.mjs']
    try:
        p = subprocess.run(cmd, cwd=d, capture_output=True, text=True,
                           encoding='utf-8', errors='replace', timeout=300)
    except subprocess.TimeoutExpired:
        return {'cid': cid, 'status': 'TIMEOUT', 'why': None, 'sec': round(time.time()-t0)}
    except Exception as e:
        return {'cid': cid, 'status': 'ERROR', 'why': str(e), 'sec': round(time.time()-t0)}
    out = (p.stdout or '').strip()
    err = (p.stderr or '').strip()

    if cid in FIXTURE_IDS:
        # parse text fixture: RESULT: PASS / FAIL count
        if 'RESULT: FAIL' in out:
            st = 'FAIL'
        else:
            fails = re.findall(r'^FAIL\b', out, re.M)
            st = 'FAIL' if fails else ('PASS' if p.returncode == 0 else 'FAIL')
        why = (out.splitlines() or [''])[-1][:300]
        j = {'status': st, 'caseId': cid, 'why': why, 'executedAt': nowts(),
             'exit': p.returncode, 'pass': st == 'PASS'}
        with open(os.path.join(d, 'stdout.log'), 'w', encoding='utf-8') as f:
            f.write(json.dumps(j, ensure_ascii=False, indent=2))
        if err:
            with open(os.path.join(d, 'stderr.log'), 'w', encoding='utf-8') as f:
                f.write(err + '\n')
        return {'cid': cid, 'status': st, 'why': why, 'rc': p.returncode,
                'sec': round(time.time()-t0, 1), 'tail': None}

    with open(os.path.join(d, 'stdout.log'), 'w', encoding='utf-8') as f:
        f.write(out + ('\n' if out else ''))
    if err:
        with open(os.path.join(d, 'stderr.log'), 'w', encoding='utf-8') as f:
            f.write(err + '\n')
    st = 'NO_STATUS'; why = None
    if out:
        try:
            j = json.loads(out)
            if isinstance(j, dict):
                s = (j.get('status') or j.get('verdict') or j.get('result') or j.get('summary'))
                if isinstance(s, str) and s.upper() in VALID:
                    st = s.upper()
                why = (j.get('why') or j.get('reason') or j.get('blockedReason'))
        except Exception:
            pass
        if st == 'NO_STATUS':
            for tok in VALID:
                if re.search(r'["\']?(?:status|verdict|result|summary)["\']?\s*[:=]\s*["\']?'+tok, out):
                    st = tok; break
    rc = p.returncode
    if st == 'NO_STATUS':
        if rc == 0 and out:
            st = 'PASS'
        elif rc != 0:
            st = 'FAIL'
    return {'cid': cid, 'status': st, 'why': (why or '')[:300], 'rc': rc,
            'sec': round(time.time()-t0, 1),
            'tail': (out[:120] + ' | ' + err[:120]) if st not in VALID else None}

only = sys.argv[1:] if len(sys.argv) > 1 else None
dirs = sorted([x for x in os.listdir(EVID) if os.path.isdir(os.path.join(EVID, x))])
results = []
for i, cid in enumerate(dirs, 1):
    if only and cid not in only:
        continue
    r = run_case(cid)
    results.append(r)
    line = f"[{i}/{len(dirs)}] {cid:14s} {r['status']:14s}"
    if r.get('why'):
        line += '  ' + str(r['why'])[:100]
    print(line, flush=True)
    if r.get('tail'):
        print('      tail:', r['tail'], flush=True)

from collections import Counter
c = Counter(r['status'] for r in results)
summary = {'counts': dict(c), 'results': results}
with open(os.path.join(HERE, '_run_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(summary, f, ensure_ascii=False, indent=1)
print('==== SUMMARY ====', flush=True)
print(json.dumps(c, ensure_ascii=False), flush=True)