# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
lines = open(p, encoding='utf-8').read().splitlines()
print('--- 1376-1451 ---')
for i in range(1375, len(lines)):
    print(i+1, ':', lines[i][:180])
