import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
for d in ['c4-service-matrix', 'd1-upgrade', 'd2-auth', 'd4-security', 'mcp-tools']:
    p = os.path.join(ev, d, 'stdout.log')
    j = json.load(open(p, encoding='utf-8-sig'))
    print('=====', d, 'total=', j.get('total'), 'passed=', j.get('passed'), 'failed=', j.get('failed'))
    if isinstance(j.get('results'), list):
        for r in j['results']:
            print('   ', r.get('id'), '|', r.get('name'), '|', r.get('pass'), '|', (r.get('actual') or '')[:60])