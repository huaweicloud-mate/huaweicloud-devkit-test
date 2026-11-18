# -*- coding: utf-8 -*-
import subprocess, sys, io, csv, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
GIT = r'C:\Users\Administrator\AppData\Local\Programs\WorkBuddy\resources\vendor\PortableGit\cmd\git.exe'
REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
base = 'results/OfficeAce/2026-11-08-119.8.181.45/Windows/'
r = subprocess.run([GIT, 'log', '--all', '--format=%H', '-1', '--', base + '用例矩阵-设计级.csv'], capture_output=True, cwd=REPO)
rev = r.stdout.decode().strip()
r2 = subprocess.run([GIT, 'show', rev + ':' + base + '用例矩阵-设计级.csv'], capture_output=True, cwd=REPO)
raw = r2.stdout.decode('utf-8-sig', errors='replace')
rows = list(csv.DictReader(io.StringIO(raw)))
dids = [x['ID'] for x in rows]
runner_ids = ['D1-3','D1-4','D1-26','D1-27','D1-28','D1-30','D1-31','D1-33','D1-39','D1-40','D1-41','D1-42','D1-45','D1-65','D1-66','D1-67','D1-68','D1-69','D1-70','D2-1','D2-2','D2-4','D2-5','D2-10','D2-11','D2-12','D2-13','D2-16','D2-26','D2-27','D3-A1','D3-B1','D3-B3','D3-B5','D3-C1','D3-C2','D3-C3','D3-C4','D3-C5','D3-C6','D3-C7','D3-C13','D3-C14','D4-1','D4-2','D4-3','D4-4','D4-5','D4-6','D4-7','D4-8','D4-9','D4-10','D4-11','D4-12','D4-13','D4-14','D4-15','D4-16','D4-17','D4-18','D4-19','D4-20','D4-21','D4-22','D4-23','D4-24','D4-25','D4-26','D4-27','D4-28','D4-29','D5-1','D5-3','D6-1','D6-3','D6-4','D6-9','D8-1','D8-4','D8-6','D8-7','D8-9','D8-10','D9-1','D9-2','D9-9','D9-10','D9-11','D9-12','D9-13','D10-3','D10-4','EXP-D5-7-1','EXP-D5-7-3']
missing = [d for d in dids if d not in runner_ids]
print('design total:', len(dids), 'runner:', len(runner_ids), 'missing from runner:', len(missing))
print(missing)
# 设计级里有没有 evidence 映射方案：看 11-08 的 evidence 152 cases 覆盖 107+39=146? 之前统计 152 case 目录
# 打印缺失用例的 标题+预期
m = {x['ID']: x for x in rows}
for d in missing:
    x = m[d]
    print('---', d, '|', x['维度'], '|', x['标题'], '|', x['优先级'])
    print('  预期:', x['预期结果'][:120])
    print('  步骤:', x['操作步骤'][:150])
    print('  工具:', x['关联工具'], '| 前置:', x['前置条件'][:80])
