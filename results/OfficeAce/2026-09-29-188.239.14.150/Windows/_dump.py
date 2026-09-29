import csv
from collections import Counter
p = '用例矩阵-设计级.csv'
rows = list(csv.DictReader(open(p, encoding='utf-8-sig')))
out = ['DESIGN total %d' % len(rows)]
out.append('PRI ' + str(Counter(x['优先级'] for x in rows)))
for x in rows:
    out.append('%s|%s|%s|agent=%s|OS=%s|term=%s|evid=%s' % (
        x['ID'], x['优先级'], (x['标题'] or '')[:32], x['agent'], x['OS'], x['terminal'], (x['requiredEvidence'] or '')[:40]))
open('_design_dump.txt', 'w', encoding='utf-8').write('\n'.join(out))

p2 = '用例矩阵-展开级.csv'
rows2 = list(csv.DictReader(open(p2, encoding='utf-8-sig')))
out2 = ['EXPAND total %d' % len(rows2)]
out2.append('PRI ' + str(Counter(x['优先级'] for x in rows2)))
for x in rows2:
    out2.append('%s|%s|%s|src=%s|agent=%s|OS=%s|term=%s|evid=%s' % (
        x['ID'], x['优先级'], (x['执行要点'] or '')[:40] if '执行要点' in x else '', x.get('源用例'), x['agent'], x['OS'], x['terminal'], (x['requiredEvidence'] or '')[:40]))
open('_expand_dump.txt', 'w', encoding='utf-8').write('\n'.join(out2))
print('OK written')