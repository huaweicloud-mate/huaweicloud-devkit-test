# -*- coding: utf-8 -*-
import csv, sys, re
sys.stdout.reconfigure(encoding='utf-8')

# design IDs from today's matrix
rows = list(csv.reader(open(r'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-11-02-119.8.181.45/Windows/用例矩阵-设计级.csv', encoding='utf-8-sig')))
hdr = rows[0]
idx = {k: i for i, k in enumerate(hdr)}
design_ids = [r[idx['ID']] for r in rows[1:]]
print('design total', len(design_ids))

# runner ids
c = open(r'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/scripts/_batch_runner_officeace_20261101.mjs', encoding='utf-8').read()
runner_ids = sorted(set(re.findall(r"writeResult\(\s*'([^']+)'", c)))
print('runner distinct', len(runner_ids))

# also exp ids from runner (EXP-)
exp_in_runner = [i for i in runner_ids if i.startswith('EXP')]
design_in_runner = [i for i in runner_ids if not i.startswith('EXP')]
print('design in runner', len(design_in_runner))

# design IDs NOT in runner
missing_design = [i for i in design_ids if i not in set(design_in_runner)]
print('design NOT in runner (need probe/reuse):')
for i in missing_design:
    print('  ', i)

# expanded matrix today
rows2 = list(csv.reader(open(r'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-11-02-119.8.181.45/Windows/用例矩阵-展开级.csv', encoding='utf-8-sig')))
hdr2 = rows2[0]
idx2 = {k: i for i, k in enumerate(hdr2)}
exp_ids = [r[idx2['ID']] for r in rows2[1:]]
print('expanded total', len(exp_ids))
print('expanded ids:', exp_ids)