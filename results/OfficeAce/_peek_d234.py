# -*- coding: utf-8 -*-
import io, csv, sys, os
sys.stdout.reconfigure(encoding='utf-8')
wd = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-07-119.8.181.45\Windows'
buf = io.StringIO()
with io.open(os.path.join(wd, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
for r in rows:
    if r['ID'].startswith(('D3-','D2-','D4-')) and not r['ID'].startswith(('D3-C4','D3-C3','D3-C14')):
        buf.write('%s|%s|%s|%s\n  steps: %s\n  expect: %s\n' % (r['ID'], r['优先级'], r['标题'], r['执行状态'], r['操作步骤'][:150], r['预期结果'][:120]))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_d234.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok', len(buf.getvalue()))
