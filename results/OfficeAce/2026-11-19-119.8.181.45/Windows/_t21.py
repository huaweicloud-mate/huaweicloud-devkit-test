# -*- coding: utf-8 -*-
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
base = 'results/OfficeAce/2026-11-08-119.8.181.45/Windows/'
# 读 CSV 列头与几行
import io
for fn in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv', '使命-mission-001.csv', '需求-设计-证据追踪表.csv']:
    r = subprocess.run([GIT, 'log', '--all', '--format=%H', '-1', '--', base + fn], capture_output=True, cwd=REPO)
    rev = r.stdout.decode().strip()
    r2 = subprocess.run([GIT, 'show', rev + ':' + base + fn], capture_output=True, cwd=REPO)
    t = r2.stdout.decode('utf-8-sig', errors='replace')
    lines = t.splitlines()
    print('=====', fn, 'rows:', len(lines)-1)
    print('HEADER:', lines[0][:400])
    for l in lines[1:3]:
        print('ROW:', l[:400])
    print()
