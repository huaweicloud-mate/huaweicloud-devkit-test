import csv, os, io
base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, '_p0.txt'), 'w', encoding='utf-8')

rows = list(csv.reader(io.open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
hdr = rows[0]
idx = {h: i for i, h in enumerate(hdr)}
out.write('=== P0 设计级 ===\n')
for r in rows[1:]:
    if r[idx['优先级']] == 'P0':
        out.write('%s | %s | %s\n' % (r[idx['ID']], r[idx['标题']], r[idx['预期结果']][:60]))
        out.write('   step: %s\n' % r[idx['操作步骤']][:80])

out.write('\n=== 展开级全部 ===\n')
rows2 = list(csv.reader(io.open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
hdr2 = rows2[0]
idx2 = {h: i for i, h in enumerate(hdr2)}
for r in rows2[1:]:
    out.write('%s | %s | %s | src=%s\n' % (r[idx2['ID']], r[idx2['优先级']], r[idx2['执行要点']][:40], r[idx2['源用例']]))

out.write('\n=== 使命 ===\n')
rows3 = list(csv.reader(io.open(os.path.join(base, '使命-mission-001.csv'), encoding='utf-8-sig')))
hdr3 = rows3[0]
idx3 = {h: i for i, h in enumerate(hdr3)}
for r in rows3[1:]:
    out.write('%s | %s | %s\n' % (r[idx3['ID']], r[idx3['missionPriority']], r[idx3['标题']]))
out.close()
print('done')