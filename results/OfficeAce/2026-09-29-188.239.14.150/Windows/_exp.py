import os, json
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\evidence'
for n in ['EXP-E01','EXP-E02','EXP-E03','EXP-E10','EXP-E13','EXP-E07','EXP-C4-01']:
    p=os.path.join(base,n,'stdout.log')
    print('==== %s ====' % n)
    if os.path.isfile(p):
        d=json.load(open(p,encoding='utf-8'))
        print(json.dumps(d,ensure_ascii=False,indent=1)[:1200])
    print()