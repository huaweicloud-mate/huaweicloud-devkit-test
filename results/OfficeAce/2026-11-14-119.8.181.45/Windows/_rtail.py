# -*- coding: utf-8 -*-
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
s = open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs', encoding='utf-8').read()
print('len', len(s))
# find end-of-main summary section
i = s.rfind('console.log')
print(s[i-2500:i+900])
