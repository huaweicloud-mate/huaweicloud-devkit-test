# -*- coding: utf-8 -*-
import subprocess, sys, io, csv
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
base = 'results/OfficeAce/2026-11-08-119.8.181.45/Windows/'
r = subprocess.run([GIT, 'log', '--all', '--format=%H', '-1', '--', base + '用例矩阵-设计级.csv'], capture_output=True, cwd=REPO)
rev = r.stdout.decode().strip()
r2 = subprocess.run([GIT, 'show', rev + ':' + base + '用例矩阵-设计级.csv'], capture_output=True, cwd=REPO)
raw = r2.stdout.decode('utf-8-sig', errors='replace')
rows = list(csv.DictReader(io.StringIO(raw)))
print('design rows:', len(rows))
from collections import Counter
print('status:', Counter(x.get('执行状态','') for x in rows))
print('prio:', Counter(x.get('优先级','') for x in rows))
# 展开级
r = subprocess.run([GIT, 'log', '--all', '--format=%H', '-1', '--', base + '用例矩阵-展开级.csv'], capture_output=True, cwd=REPO)
rev = r.stdout.decode().strip()
r2 = subprocess.run([GIT, 'show', rev + ':' + base + '用例矩阵-展开级.csv'], capture_output=True, cwd=REPO)
raw = r2.stdout.decode('utf-8-sig', errors='replace')
rows2 = list(csv.DictReader(io.StringIO(raw)))
print('expand rows:', len(rows2))
print('status:', Counter(x.get('执行状态','') for x in rows2))
print('ids:', [x['ID'] for x in rows2])
# trace
r = subprocess.run([GIT, 'log', '--all', '--format=%H', '-1', '--', base + '需求-设计-证据追踪表.csv'], capture_output=True, cwd=REPO)
rev = r.stdout.decode().strip()
r2 = subprocess.run([GIT, 'show', rev + ':' + base + '需求-设计-证据追踪表.csv'], capture_output=True, cwd=REPO)
raw = r2.stdout.decode('utf-8-sig', errors='replace')
rows3 = list(csv.DictReader(io.StringIO(raw)))
print('trace rows:', len(rows3))
print('trace header:', raw.splitlines()[0][:500])
print('status:', Counter(x.get('执行状态','') for x in rows3))
