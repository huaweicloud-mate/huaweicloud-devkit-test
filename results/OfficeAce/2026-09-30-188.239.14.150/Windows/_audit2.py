import os, json
d = 'evidence'
# print the non-PASS stdout.log contents (BLOCKED/FAIL/?)
for x in sorted(os.listdir(d)):
    p = os.path.join(d, x, 'stdout.log')
    if not os.path.isfile(p):
        continue
    raw = open(p, encoding='utf-8').read().strip()
    try:
        j = json.loads(raw)
        st = j.get('status', '?') if isinstance(j, dict) else '?'
    except Exception:
        st = 'parse-fail'
    if st not in ('PASS',):
        print('=' * 60)
        print('CASE', x, 'STATUS', st)
        print(raw[:800])
        print()