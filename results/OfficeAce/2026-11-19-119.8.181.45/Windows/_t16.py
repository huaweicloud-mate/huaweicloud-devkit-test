# -*- coding: utf-8 -*-
import subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
outdir = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-19-119.8.181.45\Windows\_ref'
pairs = [
 ('D1-39','probe.mjs'),('D4-16','probe.mjs'),('D9-12','probe.mjs'),('EXP-E01','probe.mjs'),
 ('D3-C1','probe.mjs'),('D2-4','probe.mjs'),('D4-15','probe.mjs'),('D8-7','probe.mjs'),
 ('D1-3','probe.mjs'),('D4-1','probe.mjs'),('D4-25','probe.mjs'),('D4-28','probe.mjs'),
 ('D9-10','probe.mjs'),('D9-11','probe.mjs'),('D3-C3','probe.mjs'),('D3-S1','probe.mjs'),
 ('D2-11','probe.mjs'),('D2-16','probe.mjs'),('D2-26','probe.mjs'),('D4-21','probe.mjs'),
 ('D4-22','probe.mjs'),('D4-23','probe.mjs'),('D10-4','probe.mjs'),('D6-4','probe.mjs'),
 ('D9-9','probe.mjs'),('D1-45','probe.mjs'),('D1-70','probe.mjs'),('D2-10','probe.mjs'),
]
base='results/OfficeAce/2026-11-08-119.8.181.45/Windows/evidence/'
for cid, fn in pairs:
    t = base + cid + '/' + fn
    r = subprocess.run([GIT, 'log', '--all', '--format=%H', '-1', '--', t], capture_output=True, cwd=REPO)
    rev = r.stdout.decode().strip()
    if not rev:
        print('NOREV', cid); continue
    r2 = subprocess.run([GIT, 'show', rev + ':' + t], capture_output=True, cwd=REPO)
    if r2.returncode == 0:
        open(os.path.join(outdir, cid + '-' + fn), 'wb').write(r2.stdout)
        print('saved', cid, len(r2.stdout))
    else:
        print('MISS', cid)
