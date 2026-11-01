# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
c = open(r'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/scripts/_batch_runner_officeace_20261101.mjs', encoding='utf-8').read()
for key in ['D3-C13','D3-C14']:
    i = c.find("'" + key + "'")
    print('=====', key, '@', i)
    print(c[i-400:i+1700] if i>=0 else 'NOT FOUND')
    print()