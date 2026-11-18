# -*- coding: utf-8 -*-
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
out = subprocess.run([GIT, 'log', '--all', '--diff-filter=A', '--name-only', '--pretty=format:'],
                     capture_output=True, cwd=r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test')
names = sorted(set(l.strip() for l in out.stdout.decode('utf-8', errors='replace').splitlines() if l.strip()))
rep = [n for n in names if 'OfficeAce' in n and '报告' in n]
print('--- recent reports ---')
for n in rep[-8:]: print(n)
# newest report that has evidence in same dir
import re
bydir = {}
for n in names:
    m = re.match(r'(results/OfficeAce/[^/]+/Windows)/evidence/([^/]+)/', n)
    if m:
        bydir.setdefault(m.group(1), set()).add(m.group(2))
for d in sorted(bydir)[-3:]:
    print(d, len(bydir[d]), 'cases:', sorted(bydir[d])[:10], '...' if len(bydir[d])>10 else '')
