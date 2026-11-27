# -*- coding: utf-8 -*-
import re, io, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
t = open(base + r'\scripts\_batch_runner_officeace_20261112.mjs', encoding='utf-8').read()
runner_ids = re.findall(r"writeResult\('([^']+)'", t)
print('runner cases:', len(runner_ids))
print(sorted(set(runner_ids)))
today_ids = [l.strip() for l in open(base + r'\results\OfficeAce\2026-11-28-119.8.181.45\Windows\_today_ids.txt', encoding='utf-8-sig') if l.strip()]
print('today cases:', len(today_ids))
missing = [x for x in today_ids if x not in set(runner_ids)]
extra = [x for x in runner_ids if x not in set(today_ids)]
print('in today NOT in runner:', missing)
print('in runner NOT in today:', extra)
