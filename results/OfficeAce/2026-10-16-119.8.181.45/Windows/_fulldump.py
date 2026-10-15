# -*- coding: utf-8 -*-
import csv, io, sys, os
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'
out = io.open(os.path.join(base, '_full_cases.txt'), 'w', encoding='utf-8')
rows = list(csv.DictReader(io.open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
out.write('=== DESIGN (%d) ===\n' % len(rows))
for r in rows:
    out.write('[%s|%s|%s] %s\n' % (r['ID'], r['优先级'], r['维度'], r['标题']))
    out.write('  步骤: %s\n' % (r['操作步骤'] or '').replace('\n',' '))
    out.write('  预期: %s\n' % (r['预期结果'] or '').replace('\n',' '))
    out.write('  工具: %s | 覆盖: %s\n' % (r['关联工具'] or '', r['终端覆盖类型'] or ''))
rows2 = list(csv.DictReader(io.open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
out.write('\n=== EXPANDED (%d) ===\n' % len(rows2))
for r in rows2:
    out.write('[%s|%s|%s] %s | 源=%s\n' % (r['ID'], r['优先级'], r['展开类型'], (r['执行要点'] or '').replace('\n',' ')[:120], r['源用例']))
    out.write('  预期: %s\n' % (r['预期结果'] or '').replace('\n',' ')[:150])
out.close()
print('wrote', os.path.join(base, '_full_cases.txt'))