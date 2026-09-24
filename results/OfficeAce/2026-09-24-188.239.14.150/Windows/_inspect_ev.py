import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
for d in sorted(os.listdir(ev)):
    if not os.path.isdir(os.path.join(ev, d)):
        continue
    p = os.path.join(ev, d, 'stdout.log')
    if not os.path.isfile(p):
        print(d, '=> NO_LOG')
        continue
    try:
        j = json.load(open(p, encoding='utf-8-sig'))
    except Exception as e:
        print(d, '=> PARSE_ERR', e)
        continue
    if isinstance(j, dict):
        st = j.get('status') or ('PASS' if j.get('pass') is True else ('FAIL' if j.get('pass') is False else None))
        print(d, '=>', st, '| keys=', list(j.keys()))
    else:
        print(d, '=> NON_DICT', type(j))