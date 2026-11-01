# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
c = open(r'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/scripts/_batch_runner_officeace_20261101.mjs', encoding='utf-8').read()
print("===== D2-4 block =====")
i = c.find("// D2-4")
print(c[i:i+1000])
print("\n\n===== D4-3 block =====")
j = c.find("// D4-3")
print(c[j:j+900])