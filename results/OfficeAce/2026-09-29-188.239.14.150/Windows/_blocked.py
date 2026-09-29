import csv, os, json
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows'
rows = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'),encoding='utf-8-sig')))
for r in rows:
    st=(r.get('执行状态') or '').strip().upper()
    if st in ('BLOCKED','SPEC-MISMATCH'):
        print('==== %s [%s] %s ====' % (r['ID'], r.get('优先级'), r.get('标题')))
        print('  blockedReason: %s' % (r.get('blockedReason') or '(空)'))
        print('  预期: %s' % r.get('预期结果'))
        p=os.path.join(base,'evidence',r['ID'],'stdout.log')
        if os.path.isfile(p):
            print('  stdout.log why: %s' % json.load(open(p,encoding='utf-8')).get('why'))
        print()