# -*- coding: utf-8 -*-
import io, csv, sys, os
sys.stdout.reconfigure(encoding='utf-8')
wd = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-07-119.8.181.45\Windows'
out = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_alldesign.txt'
with io.open(os.path.join(wd, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
buf = io.StringIO()
for r in rows:
    buf.write('%s|%s|%s|%s|%s\n' % (r['ID'], r['优先级'], r['标题'], r['执行状态'], r['evidencePath']))
io.open(out,'w',encoding='utf-8').write(buf.getvalue())
print('ok', len(rows))
