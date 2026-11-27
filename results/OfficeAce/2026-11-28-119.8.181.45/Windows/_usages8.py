# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
lines = open(p, encoding='utf-8').read().splitlines()
for i in range(170, 196):
    print(i+1, ':', lines[i][:165])
