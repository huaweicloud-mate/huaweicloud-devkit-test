import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
files = ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv', '需求-设计-证据追踪表.csv']
for f in files:
    with open(f, encoding='utf-8-sig') as fh:
        rows = list(csv.DictReader(fh))
    print('=====', f, 'rows=', len(rows))
    if not rows:
        print('  (empty)')
        continue
    keys = list(rows[0].keys())
    cidk = '用例ID' if '用例ID' in keys else 'ID'
    titlek = '用例名称' if '用例名称' in keys else ('用例标题' if '用例标题' in keys else '标题')
    prik = '优先级'
    statk = '执行状态'
    from collections import Counter
    cnt = Counter()
    for r in rows:
        cid = str(r.get(cidk, '')).strip()
        if not cid:
            cid = str(r.get('展开用例ID', '')).strip()
        pri = str(r.get(prik, '')).replace('P', '').strip()
        cnt[pri] += 1
    print('COLS:', keys)
    print('PRI distribution:', dict(cnt))
    for i, r in enumerate(rows):
        cid = str(r.get(cidk, '') or r.get('展开用例ID', '') or '').strip()
        title = str(r.get(titlek, '') or '').strip()[:80]
        pri = str(r.get(prik, '') or '').strip()
        status = str(r.get(statk, '') or '').strip()
        dur = str(r.get('执行时间', '') or '').strip()
        print(f'{i+1}|{cid}|{title}|[{pri}]|{status}|{dur}')