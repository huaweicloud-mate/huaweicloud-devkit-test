import csv, io, os

base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, '_compact.txt'), 'w', encoding='utf-8')

rows = list(csv.DictReader(io.open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
out.write('### DESIGN %d\n' % len(rows))
for r in rows:
    out.write('%s|%s|%s|%s\n' % (r['ID'], r['优先级'], r['维度'], r['标题'].replace('\n', ' ')))

rows = list(csv.DictReader(io.open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
out.write('### EXPANDED %d\n' % len(rows))
for r in rows:
    out.write('%s|%s|%s|%s|%s\n' % (r['ID'], r['优先级'], r['展开类型'], r['枚举对象'], r['执行要点'].replace('\n', ' ')[:120]))
out.close()
print('ok')
