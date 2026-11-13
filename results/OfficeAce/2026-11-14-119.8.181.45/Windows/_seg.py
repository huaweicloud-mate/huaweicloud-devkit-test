# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs"
t = open(p, encoding='utf-8').read().splitlines()
out = []
for i in range(655, 768):
    out.append('%d: %s' % (i + 1, t[i][:170]))
o = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-14-119.8.181.45\Windows\_seg_659_768.txt"
open(o, 'w', encoding='utf-8').write('\n'.join(out))
print('ok')
