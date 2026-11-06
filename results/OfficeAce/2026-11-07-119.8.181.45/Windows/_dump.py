# -*- coding: utf-8 -*-
import csv, io

rows = list(csv.reader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
buf = io.StringIO()
for r in rows[1:]:
    buf.write('==== {id} | {dim} | {prio} ====\n'.format(id=r[0], dim=r[1], prio=r[3]))
    buf.write('标题: {}\n'.format(r[2]))
    buf.write('前置: {}\n'.format(r[4]))
    buf.write('数据: {}\n'.format(r[5]))
    buf.write('步骤: {}\n'.format(r[6]))
    buf.write('预期: {}\n'.format(r[7]))
    buf.write('工具: {}\n'.format(r[9]))
open('_design_full.txt', 'w', encoding='utf-8').write(buf.getvalue())

rows2 = list(csv.reader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
hdr = rows2[0]
buf2 = io.StringIO()
buf2.write('COLS={}\n'.format(len(hdr)))
buf2.write('HEADER: {}\n'.format(' | '.join(hdr)))
for r in rows2[1:]:
    buf2.write('{} | {} | {} | {}\n'.format(r[0], r[1] if len(r) > 1 else '', r[3] if len(r) > 3 else '', r[2] if len(r) > 2 else ''))
open('_exp_list.txt', 'w', encoding='utf-8').write(buf2.getvalue())
print('dumped', len(rows) - 1, len(rows2) - 1)