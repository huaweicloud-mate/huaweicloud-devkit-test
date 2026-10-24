import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
rows = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
for r in rows:
    print(r['ID'], '|', r['展开类型'], '|', r['源用例'], '|', r.get('agent','')[:20], '|', (r.get('执行要点','') or '')[:50])
print('TOTAL', len(rows))