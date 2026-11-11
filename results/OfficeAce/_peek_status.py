# -*- coding: utf-8 -*-
import io, csv, sys, os
sys.stdout.reconfigure(encoding='utf-8')
wd = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-07-119.8.181.45\Windows'
buf = io.StringIO()
with io.open(os.path.join(wd, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
want = ['D3-C1','D3-C2','D3-C5','D3-C6','D3-C7','D3-C13','D3-S1','D3-S2','D3-S4','D3-S7','D3-B1','D3-B3','D3-B5','D2-1','D2-4','D4-1','D4-4','D4-15','D4-21','D4-23','D4-28','D8-7','D8-9','D6-4','D6-9','D1-3','D1-41','D1-70','D2-11','D2-16','D2-26','D4-8','D4-13','EXP-C4-01']
for r in rows:
    if r['ID'] in want:
        buf.write('%s | %s | %s | ev=%s | why=%s\n' % (r['ID'], r['优先级'], r['执行状态'], (r.get('evidencePath') or '')[:60], (r.get('blockedReason') or '')[:80]))
# also expanded C4 rows
with io.open(os.path.join(wd, '用例矩阵-展开级.csv'), encoding='utf-8-sig') as f:
    erows = list(csv.DictReader(f))
c4 = [r for r in erows if r['ID'].startswith('EXP-C4')]
buf.write('EXP-C4 count=%d sample statuses: %s\n' % (len(c4), {r['ID']: r['执行状态'] for r in c4[:5]}))
e01 = [r for r in erows if r['ID'].startswith('EXP-E')]
buf.write('EXP-E statuses: %s\n' % {r['ID']: r['执行状态'] for r in e01})
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_prev_status.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
