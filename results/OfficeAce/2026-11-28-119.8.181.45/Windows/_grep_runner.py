# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
lines = open(p, encoding='utf-8').read().splitlines()
pat = re.compile(r"D3-S|'D9-[3-8]'|S_SERVICES|D9_LOOP|SERVICES\s*=")
for i, l in enumerate(lines, 1):
    if pat.search(l):
        print(i, ':', l.strip()[:160])
