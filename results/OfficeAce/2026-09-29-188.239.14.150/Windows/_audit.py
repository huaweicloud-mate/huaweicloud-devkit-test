import os, csv
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows'
ev = os.path.join(base, 'evidence')
fake = []
stat = {'PASS':0,'FAIL':0,'BLOCKED':0,'SPEC-MISMATCH':0,'NOT_RUN':0,'':0}
for fn in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv']:
    for r in csv.DictReader(open(os.path.join(base,fn),encoding='utf-8-sig')):
        st = (r.get('执行状态') or '').strip().upper()
        stat[st] = stat.get(st,0)+1
        if st == 'PASS':
            ep = (r.get('evidencePath') or '').strip()
            if not ep:
                fake.append((r['ID'],'PASS无evidencePath'))
            elif not os.path.isfile(os.path.join(base, ep, 'stdout.log')):
                fake.append((r['ID'],'PASS证据stdout.log缺失:'+ep))
        if st == 'BLOCKED':
            br = (r.get('blockedReason') or '').strip()
            if not br:
                fake.append((r['ID'],'BLOCKED无blockedReason'))
print('状态统计:', stat)
print('证据校验问题:', fake if fake else '无 — 所有PASS均有evidencePath+stdout.log，所有BLOCKED均有原因')
# 检查 SPEC-MISMATCH 是否有 evidencePath
for fn in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv']:
    for r in csv.DictReader(open(os.path.join(base,fn),encoding='utf-8-sig')):
        st=(r.get('执行状态') or '').strip().upper()
        if st in ('FAIL','SPEC-MISMATCH'):
            ep=(r.get('evidencePath') or '').strip()
            f=os.path.isfile(os.path.join(base,ep,'stdout.log')) if ep else False
            print('  %s %s evidencePath=%s stdout.log存在=%s'%(r['ID'],st,ep,f))