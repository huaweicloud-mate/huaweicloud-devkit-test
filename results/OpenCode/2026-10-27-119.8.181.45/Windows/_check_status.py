import csv, os
base = os.path.dirname(os.path.abspath(__file__))
for fname in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    fpath = os.path.join(base, fname)
    with open(fpath, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    from collections import Counter
    statuses = Counter()
    missing = []
    for r in rows:
        status = (r.get('执行状态') or '').strip()
        statuses[status] += 1
        if not status:
            missing.append(r.get('ID', ''))
    print(f'=== {fname} ({len(rows)} rows) ===')
    print(f'Status distribution: {dict(statuses)}')
    if missing:
        print(f'Missing status ({len(missing)}): {missing}')
    else:
        print('All cases have status!')
    print()
