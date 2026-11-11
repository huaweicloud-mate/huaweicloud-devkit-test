# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
os.chdir(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test')
t = open('scripts/_batch_runner_officeace_20261111.mjs', encoding='utf-8').read()
t2 = t.replace('2026-11-11-119.8.181.45', '2026-11-12-119.8.181.45')
open('scripts/_batch_runner_officeace_20261112.mjs', 'w', encoding='utf-8').write(t2)
print('written', len(t2))
print([l for l in t2.splitlines() if '2026-11-12' in l])
