# -*- coding: utf-8 -*-
import csv, io, os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'

rows = list(csv.DictReader(io.open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
for r in rows:
    print('### ' + r['ID'] + ' [' + r['优先级'] + '] ' + r['标题'])
    print('  维度=' + r['维度'] + ' 覆盖=' + r['终端覆盖类型'] + ' agent=' + (r['agent'] or '')[:30])
    print('  关联工具=' + (r['关联工具'] or '')[:60])
    print('  操作步骤=' + (r['操作步骤'] or '').replace('\n',' ')[:200])
    print('  预期=' + (r['预期结果'] or '').replace('\n',' ')[:150])
    print('  requiredEvidence=' + (r['requiredEvidence'] or '')[:80])