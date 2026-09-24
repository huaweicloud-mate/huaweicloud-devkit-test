import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')
base_ref = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-22-188.239.14.150\Windows\evidence'
missing = ['D4-18','D4-19','D4-3','D4-23','D8-7','D9-12','D9-13','D10-4']
for d in missing:
    p = os.path.join(base_ref, d)
    print('=====', d)
    if os.path.isdir(p):
        for f in sorted(os.listdir(p)):
            fp = os.path.join(p, f)
            print('   ', f, os.path.getsize(fp))
    else:
        print('   NO DIR')