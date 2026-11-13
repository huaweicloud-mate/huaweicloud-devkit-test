# -*- coding: utf-8 -*-
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
s = open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs', encoding='utf-8').read()
i = s.find('writeSummary')
print('writeSummary at', i)
print(s[max(0,i-200):i+1600])
