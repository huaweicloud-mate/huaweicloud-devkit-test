import csv, io, os
base = os.path.dirname(os.path.abspath(__file__))
out = []
rows = list(csv.DictReader(io.open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig')))
from collections import Counter
out.append('=== 设计级 %d 条 ===' % len(rows))
out.append('优先级分布: %s' % dict(Counter(r['优先级'] for r in rows)))
out.append('状态分布: %s' % dict(Counter(r['执行状态'] for r in rows)))
for r in rows:
    out.append('%s | %s | %s | %s | %s' % (r['ID'], r['优先级'], r['维度'], r['标题'][:60], r['终端覆盖类型']))
out.append('')
rows2 = list(csv.DictReader(io.open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig')))
out.append('=== 展开级 %d 条 ===' % len(rows2))
out.append('优先级分布: %s' % dict(Counter(r['优先级'] for r in rows2)))
out.append('状态分布: %s' % dict(Counter(r['执行状态'] for r in rows2)))
for r in rows2:
    out.append('%s | %s | %s | %s | %s' % (r['ID'], r['优先级'], r['展开类型'], (r['执行要点'] or '')[:60], r['designCaseId']))
out.append('')
rows3 = list(csv.DictReader(io.open(os.path.join(base,'使命-mission-001.csv'), encoding='utf-8-sig')))
out.append('=== 使命 mission-001 %d 条 ===' % len(rows3))
for r in rows3:
    out.append('%s | %s | %s' % (r['ID'], r['优先级'], r['标题'][:60]))
io.open(os.path.join(base,'_caselist.txt'),'w',encoding='utf-8').write('\n'.join(out))
print('ok')
