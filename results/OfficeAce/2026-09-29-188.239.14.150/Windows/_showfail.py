import os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\evidence'
for name in ['D2-4','D4-16','D4-27','D8-4','D9-2','D9-9']:
    p = os.path.join(base, name, 'stdout.log')
    print('===== %s =====' % name)
    if os.path.isfile(p):
        print(open(p, encoding='utf-8').read())
    else:
        print('(no stdout.log)')
    print()