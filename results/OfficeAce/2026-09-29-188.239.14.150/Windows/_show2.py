import os, json
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\evidence'
names = ['D1-39','D4-18','D2-4','EXP-C4-01','D9-1','D4-16','D4-27','D8-4','D9-2','D9-9','EXP-E06','EXP-E15','D5-1','D5-3','D3-C4','D4-2','D4-28','D9-12','EXP-D5-7-1','EXP-D5-7-3']
for n in names:
    p = os.path.join(base, n, 'stdout.log')
    if os.path.isfile(p):
        print('==== %s ====' % n)
        print(open(p, encoding='utf-8').read())
        print()