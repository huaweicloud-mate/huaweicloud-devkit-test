# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
lines = open(p, encoding='utf-8').read().splitlines()
ranges = [(395,520),(560,680)]
for a,b in ranges:
    print(f'===== {a}-{b} =====')
    for i in range(a-1, min(b, len(lines))):
        print(i+1, ':', lines[i][:170])
