# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
c = open(r'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/scripts/_batch_runner_officeace_20261101.mjs', encoding='utf-8').read()
for key in ['D3-C4','D3-C5','D3-C6','D3-C7','D3-C13','D3-C14','D3-C1','D3-C2']:
    i = c.find("// " + key)
    print('=====', key, '@', i)
    if i >= 0:
        print(c[i:i+600])
    print()