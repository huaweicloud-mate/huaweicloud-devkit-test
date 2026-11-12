# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
t = open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261111.mjs', encoding='utf-8').read()
lines = t.splitlines()
for i, l in enumerate(lines[:60]):
    print(i, l[:160])
