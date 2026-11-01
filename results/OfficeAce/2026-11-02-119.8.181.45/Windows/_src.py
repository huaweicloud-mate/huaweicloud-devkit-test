# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
c = open(r'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs', encoding='utf-8').read()
print('=== redactSecrets ===')
i = c.find('redactSecrets')
print(c[i:i+1600] if i>=0 else 'NOT FOUND')
print()
print('=== classify write/decrypt patterns ===')
# print lines mentioning allow/decrypt decision
for m in re.finditer(r'risk:\s*.\w+.', c):
    print(c[m.start()-50:m.start()+120])
    print('---')