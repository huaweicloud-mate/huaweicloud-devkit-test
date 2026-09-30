import os, json
d = 'evidence'
for x in sorted(os.listdir(d)):
    p = os.path.join(d, x, 'stdout.log')
    if os.path.isfile(p):
        raw = open(p, encoding='utf-8').read().strip()
        try:
            j = json.loads(raw)
        except Exception:
            print(x, 'PARSE FAIL')
            print(repr(raw[:200]))
            continue
        if isinstance(j, dict):
            st = j.get('status')
            if st is None:
                print(x, 'NO STATUS KEY ->', list(j.keys())[:8])
        else:
            print(x, 'NOT DICT ->', type(j))