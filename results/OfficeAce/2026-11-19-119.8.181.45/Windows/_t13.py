# -*- coding: utf-8 -*-
import subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
base = 'results/OfficeAce/2026-11-08-119.8.181.45/Windows/'
outdir = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-19-119.8.181.45\Windows\_ref'
os.makedirs(outdir, exist_ok=True)

out = subprocess.run([GIT, 'log', '--all', '--diff-filter=A', '--name-only', '--pretty=format:'],
                     capture_output=True, cwd=REPO)
names = sorted(set(l.strip() for l in out.stdout.decode('utf-8', errors='replace').splitlines() if l.strip()))
targets = [n for n in names if n.startswith('results/OfficeAce/2026-11-08') and ('报告' in n or 'FINDINGS' in n)]
targets += [base+'evidence/D4-1/probe.js', base+'evidence/D4-1/stdout.log',
            base+'evidence/D4-16/probe.js', base+'evidence/D9-12/probe.js',
            base+'evidence/EXP-E01/probe.js', base+'evidence/D1-39/probe.js']
for t in targets:
    r = subprocess.run([GIT, 'log', '--all', '--format=%H', '-1', '--', t], capture_output=True, cwd=REPO)
    rev = r.stdout.decode().strip()
    if not rev:
        print('NOREV', t); continue
    r2 = subprocess.run([GIT, 'show', rev + ':' + t], capture_output=True, cwd=REPO)
    if r2.returncode == 0:
        fn = os.path.join(outdir, t.replace('/', '_')[-90:])
        open(fn, 'wb').write(r2.stdout)
        print('saved', len(r2.stdout), t)
    else:
        print('MISS', t)
