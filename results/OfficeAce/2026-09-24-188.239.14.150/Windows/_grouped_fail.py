import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
for d in ['d2-auth', 'd4-security', 'mcp-tools']:
    j = json.load(open(os.path.join(base, 'evidence', d, 'stdout.log'), encoding='utf-8-sig'))
    print('=====', d, 'failed=', j.get('failed'))
    for r in j['results']:
        if r.get('pass') is False:
            print('  FAIL:', r.get('id'), '|', r.get('name'), '| actual=', r.get('actual'), '| expected=', r.get('expected'), '|', r.get('failMsg'))