# -*- coding: utf-8 -*-
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
out = subprocess.run([GIT, 'log', '--all', '--diff-filter=A', '--name-only', '--pretty=format:'],
                     capture_output=True, cwd=REPO)
names = sorted(set(l.strip() for l in out.stdout.decode('utf-8', errors='replace').splitlines() if l.strip()))
# 11-08 目录下 evidence 全部文件名
sub = sorted(n for n in names if n.startswith('results/OfficeAce/2026-11-08-119.8.181.45/Windows/evidence/'))
print('total evidence files:', len(sub))
# 按文件名分布
from collections import Counter
c = Counter(n.rsplit('/',1)[-1] for n in sub)
print(c.most_common(10))
# 每用例文件数
c2 = Counter(n.split('/evidence/')[1].split('/')[0] for n in sub)
items = sorted(c2.items())
print('cases:', len(items))
print(items[:15])
# D9-12 的文件
for n in sub:
    if '/D9-12/' in n or '/EXP-E01/' in n or '/D1-39/' in n or '/D3-C1/' in n:
        print(n)
