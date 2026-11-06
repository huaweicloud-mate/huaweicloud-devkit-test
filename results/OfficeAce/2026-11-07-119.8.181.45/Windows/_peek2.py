import csv, glob, os
for f in ['用例矩阵-展开级.csv', '用例矩阵-设计级.csv']:
    r = list(csv.DictReader(open(f, encoding='utf-8-sig')))
    print('='*80)
    print(f, 'cases', len(r))
    for row in r:
        cid = row.get('ID','')
        prio = row.get('优先级','')
        title = row.get('标题','') or row.get('源用例','')
        agent = row.get('agent','')
        osv = row.get('OS','')
        print(f"{cid} | {prio} | {agent}/{osv} | {title[:60]}")