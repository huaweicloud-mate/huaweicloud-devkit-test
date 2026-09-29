import csv, os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows'
des = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig')))
exp = list(csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig')))
ev = os.path.join(base,'evidence')
evdirs = set(os.listdir(ev))
def haslog(d): return os.path.isfile(os.path.join(ev,d,'stdout.log'))
print('=== 设计级 P0/P1/P2 缺证据对照 ===')
for p in ['P0','P1','P2']:
    miss = [x['ID'] for x in des if x['优先级']==p and x['ID'] not in evdirs]
    nolog = [x['ID'] for x in des if x['优先级']==p and x['ID'] in evdirs and not haslog(x['ID'])]
    has = [x['ID'] for x in des if x['优先级']==p and x['ID'] in evdirs and haslog(x['ID'])]
    print('%s: 总%d, 有log %d, 目录存在但无log %s' % (p, len([x for x in des if x['优先级']==p]), len(has), nolog))
    print('  缺证据(无目录): %s' % miss)
print()
print('=== 展开级缺证据对照 ===')
for p in ['P0','P1','P2']:
    miss = [x['ID'] for x in exp if x['优先级']==p and x['ID'] not in evdirs]
    has = [x['ID'] for x in exp if x['优先级']==p and x['ID'] in evdirs]
    print('%s: 总%d, 有目录 %d, 缺 %s' % (p, len([x for x in exp if x['优先级']==p]), len(has), miss))
print()
# evidence 里多余目录（不在任何CSV ID里）
des_ids = set(x['ID'] for x in des); exp_ids = set(x['ID'] for x in exp)
extra = sorted(evdirs - des_ids - exp_ids)
print('evidence 多余目录(非CSV ID): %s' % extra)