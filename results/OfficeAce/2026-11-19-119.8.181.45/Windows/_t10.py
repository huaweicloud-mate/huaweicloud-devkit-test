# -*- coding: utf-8 -*-
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
out = subprocess.run([GIT, 'log', '--all', '--diff-filter=A', '--name-only', '--pretty=format:'],
                     capture_output=True, cwd=r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test')
names = set(l.strip() for l in out.stdout.decode('utf-8', errors='replace').splitlines() if l.strip())
rep = sorted(n for n in names if 'OfficeAce' in n and '报告' in n)
ev = sorted(n for n in names if 'OfficeAce' in n and '/evidence/' in n)
print('reports:', len(rep))
for n in rep[:8]: print(' ', n)
print('evidence files:', len(ev))
for n in ev[:15]: print(' ', n)
