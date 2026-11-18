# -*- coding: utf-8 -*-
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
out = subprocess.run([GIT, 'log', '--all', '--diff-filter=A', '--name-only', '--pretty=format:'],
                     capture_output=True, cwd=REPO)
names = sorted(set(l.strip() for l in out.stdout.decode('utf-8', errors='replace').splitlines() if l.strip()))
# scripts 下含 caseId 写证据的文件（历史 git 里的）
sub = sorted(n for n in names if n.startswith('scripts/') and ('.mjs' in n or '.py' in n))
print('script files in history:', len(sub))
hits = {}
for n in sub:
    r = subprocess.run([GIT, 'log', '--all', '--format=%H', '-1', '--', n], capture_output=True, cwd=REPO)
    rev = r.stdout.decode().strip()
    if not rev:
        continue
    r2 = subprocess.run([GIT, 'show', rev + ':' + n], capture_output=True, cwd=REPO)
    t = r2.stdout.decode('utf-8', errors='replace')
    import re
    ids = set(re.findall(r"writeResult\('([^']+)'", t))
    for i in ids:
        hits.setdefault(i, []).append(n)
print('total distinct ids in history scripts:', len(hits))
for k in ['D2-30','D6-10','D8-2','D9-3','D10-1','D3-A2','D2-53','EXP-E01','EXP-E04','D1-12','D5-5','D9-4','D9-5','D9-6','D9-7','D9-8','D4-30','D3-S4']:
    print(k, '->', hits.get(k, ['NONE'])[:2])
