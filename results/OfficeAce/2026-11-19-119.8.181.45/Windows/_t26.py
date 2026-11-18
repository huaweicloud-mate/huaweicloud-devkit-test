# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
t = open(p, encoding='utf-8', errors='replace').read()
# D3-S 相关段落
i = t.find('D3-S1')
print('--- D3-S section ---')
print(t[i-400:i+5200])
