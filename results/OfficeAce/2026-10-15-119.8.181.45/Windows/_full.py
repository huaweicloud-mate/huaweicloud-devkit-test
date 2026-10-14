import csv, os, io
base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, '_full.txt'), 'w', encoding='utf-8')

rows2 = list(csv.reader(io.open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
hdr2 = rows2[0]
idx2 = {h: i for i, h in enumerate(hdr2)}
out.write('=== 展开级完整 (%d) ===\n' % (len(rows2)-1))
for r in rows2[1:]:
    out.write('%s | %s | src=%s | %s\n' % (r[idx2['ID']], r[idx2['优先级']], r[idx2['源用例']], r[idx2['执行要点']]))
out.write('\n=== 设计级完整 (%d) ===\n' % (len(rows2)-1))
rows = list(csv.reader(io.open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
hdr = rows[0]
idx = {h: i for i, h in enumerate(hdr)}
for r in rows[1:]:
    out.write('%s | %s | %s\n' % (r[idx['ID']], r[idx['优先级']], r[idx['标题']]))
out.close()