# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
t = open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs', encoding='utf-8', errors='replace').read()
# 所有 writeResult 的 caseId
ids = re.findall(r"writeResult\('([^']+)'", t)
print('cases in runner:', len(ids))
print(ids)
# 段落标记
marks = re.findall(r"// ===== ([^\n]+)", t)
print(marks)
print('tail:')
print(t[-2500:])
