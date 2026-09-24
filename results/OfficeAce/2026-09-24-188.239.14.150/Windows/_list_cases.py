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
    print('COLS:', keys)
    for i, r in enumerate(rows):
        cid = r.get('用例ID') or r.get('ID') or (r[keys[0]] if keys else '')
        title = r.get('用例名称') or r.get('用例标题') or (r[keys[1]] if len(keys) > 1 else '')
        pri = r.get('优先级') or r.get('P') or ''
        status = r.get('执行状态') or ''
        print(i + 1, '|', cid, '|', str(title)[:70], '| P', pri, '|', status)