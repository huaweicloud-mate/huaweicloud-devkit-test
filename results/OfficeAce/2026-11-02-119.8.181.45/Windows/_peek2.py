# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
c = open(r'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/scripts/_batch_runner_officeace_20261101.mjs', encoding='utf-8').read()
for key in ['D2-4','D4-3','D3-C3','D3-C14','D3-S3','D3-S7','D1-67','D9-3']:
    i = c.find("'" + key + "'")
    if i < 0:
        i = c.find(key)
    print('=====', key, '@', i)
    print(c[i:i+700])