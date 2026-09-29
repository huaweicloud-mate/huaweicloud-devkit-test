import os, json
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\evidence'
names = ['D1-66','D1-69','D1-70','D2-4','D3-S4','D4-16','D4-27','D8-10','D8-4','D8-9',
         'D9-10','D9-11','D9-12','D9-13','D9-2','D9-4','D9-5','D9-9',
         'EXP-E01','EXP-E02','EXP-E03','EXP-E04','EXP-E05','EXP-E07','EXP-E10',
         'EXP-E11','EXP-E12','EXP-E13','EXP-E14']
for n in names:
    p = os.path.join(base, n, 'stdout.log')
    if os.path.isfile(p):
        print('==== %s ====' % n)
        print(open(p, encoding='utf-8').read())
        print()