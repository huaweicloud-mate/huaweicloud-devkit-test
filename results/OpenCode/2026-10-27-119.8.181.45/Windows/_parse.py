import csv, os
base = os.path.dirname(os.path.abspath(__file__))
for fname in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    fpath = os.path.join(base, fname)
    with open(fpath, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    print(f'=== {fname} ({len(rows)} rows) ===')
    from collections import Counter
    pri = Counter(r.get('优先级', '') for r in rows)
    print('By priority:', dict(pri))
    # Group by priority
    for p in ['P0', 'P1', 'P2']:
        prows = [r for r in rows if r.get('优先级') == p]
        print(f'\n--- {p} ({len(prows)} cases) ---')
        for r in prows:
            idv = r.get('ID', '')
            title = r.get('标题', '') or r.get('展开类型', '')
            dim = r.get('维度', '') or r.get('枚举对象', '')
            exp = r.get('预期结果', '')[:80]
            steps = r.get('操作步骤', '') or r.get('执行要点', '')
            tools = r.get('关联工具', '')
            print(f'  {idv} | {dim} | {title[:40]} | steps={steps[:60]} | expect={exp}')
    print()
