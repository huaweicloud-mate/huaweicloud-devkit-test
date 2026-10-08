import os, io, sys, shutil
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
YEST = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence'
TODAY = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-01-188.239.14.150/Windows/evidence'
for f in ['_helper.mjs']:
    src = os.path.join(YEST, f)
    if os.path.isfile(src):
        shutil.copy(src, os.path.join(TODAY, f))
        print('copied', f)
    else:
        print('missing', f)
print('today evidence root files:', sorted(os.listdir(TODAY)))