# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs"
lines = open(p, encoding='utf-8').read().splitlines()
# print section markers: lines containing 'case' blocks or comments
out = []
for i, l in enumerate(lines):
    if l.strip().startswith('//') or 'writeResult(' in l or l.strip().startswith('async function') or l.strip().startswith('function'):
        out.append('%d: %s' % (i + 1, l[:150]))
open(r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-14-119.8.181.45\Windows\_runner_map.txt", 'w', encoding='utf-8').write('\n'.join(out))
print('sections:', len(out))
