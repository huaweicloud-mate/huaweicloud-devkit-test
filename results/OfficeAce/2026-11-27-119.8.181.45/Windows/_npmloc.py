import os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
core = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core'
for f in sorted(os.listdir(core)):
    print(' ', f)
npm = os.popen('npm root -g').read().strip()
print('npm root -g:', npm)
gd = os.path.join(npm, 'huaweicloud-devkit')
if os.path.exists(gd):
    for f in sorted(os.listdir(gd))[:30]:
        print(' npm-pkg:', f)
    j = json.load(open(os.path.join(gd, 'package.json'), encoding='utf-8')) if os.path.exists(os.path.join(gd,'package.json')) else {}
    print('npm version:', j.get('version'), 'main:', j.get('main'))
