# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
lines = open(p, encoding='utf-8').read().splitlines()
print('--- around 1200-1240 ---')
for i in range(1199, 1240):
    print(i+1, ':', lines[i][:170])
print('--- around 1320-1400 ---')
for i in range(1319, 1400):
    print(i+1, ':', lines[i][:170])
print('--- tail 1400-1451 ---')
for i in range(1399, len(lines)):
    print(i+1, ':', lines[i][:170])
