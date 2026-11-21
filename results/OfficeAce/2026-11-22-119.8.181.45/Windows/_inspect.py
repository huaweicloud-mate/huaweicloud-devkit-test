import csv, io, sys, os
base = os.path.dirname(os.path.abspath(__file__))
out = []
for f in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv','需求-设计-证据追踪表.csv','使命-mission-001.csv']:
    p = os.path.join(base, f)
    rows = list(csv.DictReader(io.open(p, encoding='utf-8-sig')))
    out.append(f'{f}: {len(rows)} rows')
    out.append('  cols: ' + ' | '.join(rows[0].keys()))
io.open(os.path.join(base, '_inspect.txt'), 'w', encoding='utf-8').write('\n'.join(out))
print('written')
