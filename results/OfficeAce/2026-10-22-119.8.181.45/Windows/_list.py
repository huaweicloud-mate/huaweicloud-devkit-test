import csv, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
for fn in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    print('='*80)
    print('FILE:', fn)
    with open(fn, encoding='utf-8-sig') as fh:
        rows = list(csv.DictReader(fh))
    from collections import Counter
    c = Counter(r.get('优先级','') for r in rows)
    print('PRIORITY COUNTS:', dict(c))
    print('---')
    for r in rows:
        print(r['ID'], '|', r.get('优先级',''), '|', r.get('agent','')[:20], '|', r.get('OS','')[:15], '|', (r.get('标题','') or r.get('源用例',''))[:45])