import os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-24-188.239.14.150\Windows\evidence'
for d in ['D8-7', 'D9-12', 'D9-13', 'D4-16', 'D4-28']:
    p = os.path.join(base, d)
    print('=====', d, 'isdir=', os.path.isdir(p))
    if os.path.isdir(p):
        for f in os.listdir(p):
            fp = os.path.join(p, f)
            print('   ', repr(f), os.path.getsize(fp))