# -*- coding: utf-8 -*-
import subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
base = 'results/OfficeAce/2026-11-12-119.8.181.45/Windows/'
outdir = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-19-119.8.181.45\Windows\_ref'
os.makedirs(outdir, exist_ok=True)

# 找 11-12 目录下的报告文件名
out = subprocess.run([GIT, 'log', '--all', '--diff-filter=A', '--name-only', '--pretty=format:'],
                     capture_output=True, cwd=REPO)
names = sorted(set(l.strip() for l in out.stdout.decode('utf-8', errors='replace').splitlines() if l.strip()))
rep12 = [n for n in names if n.startswith('results/OfficeAce/2026-11-12') and '报告' in n]
print('reports in 11-12:', rep12)
targets = rep12 + [base + 'FINDINGS.md']
targets += [base + 'evidence/D4-1/probe.js', base + 'evidence/D4-1/stdout.log',
            base + 'evidence/D1-3/probe.js', base + 'evidence/D1-3/stdout.log',
            base + 'evidence/EXP-E01/probe.js', base + 'evidence/EXP-E01/stdout.log']
for t in targets:
    if not t:
        continue
    r = subprocess.run([GIT, 'show', t], capture_output=True, cwd=REPO)
    if r.returncode == 0:
        fn = os.path.join(outdir, t.replace('/', '_')[-80:])
        open(fn, 'wb').write(r.stdout)
        print('saved', t, len(r.stdout), 'bytes')
    else:
        print('MISS', t, r.stderr.decode('utf-8', errors='replace')[:100])
