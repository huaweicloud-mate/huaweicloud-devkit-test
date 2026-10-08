import subprocess, os, sys
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evidence')
groups = ['d4-security','d2-auth','d1-upgrade','mcp-tools','c4-service-matrix']
for g in groups:
    d = os.path.join(base, g)
    probe = os.path.join(d, 'probe.mjs')
    if not os.path.isfile(probe):
        print('MISSING', g); continue
    for f in ('stdout.log','stderr.log'):
        p = os.path.join(d, f)
        if os.path.exists(p): os.remove(p)
    r = subprocess.run(['node', probe], capture_output=True, text=True, encoding='utf-8', cwd=d)
    with open(os.path.join(d,'stdout.log'),'w',encoding='utf-8') as f:
        f.write(r.stdout)
    with open(os.path.join(d,'stderr.log'),'w',encoding='utf-8') as f:
        f.write(r.stderr)
    code = r.returncode
    # pass count
    import json
    passed = failed = None
    try:
        obj = json.loads(r.stdout)
        passed = obj.get('passed'); failed = obj.get('failed'); total = obj.get('total')
    except Exception:
        pass
    print(f'{g}: exit={code} total={total} passed={passed} failed={failed} stdout={len(r.stdout)} stderr={len(r.stderr)}')