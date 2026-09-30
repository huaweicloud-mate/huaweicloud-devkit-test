import os, json
d = 'evidence'
dirs = sorted(os.listdir(d))
c = {}
for x in dirs:
    p = os.path.join(d, x, 'stdout.log')
    if os.path.isfile(p):
        raw = open(p, encoding='utf-8').read().strip()
        try:
            j = json.loads(raw)
            st = j.get('status', '?') if isinstance(j, dict) else '?'
        except Exception:
            st = 'parse-fail'
        c[st] = c.get(st, 0) + 1
    else:
        c['NO-stdout'] = c.get('NO-stdout', 0) + 1
print('total dirs', len(dirs))
print(json.dumps(c, ensure_ascii=False))
print('--- NO stdout dirs ---')
for x in dirs:
    if not os.path.isfile(os.path.join(d, x, 'stdout.log')):
        print(x)