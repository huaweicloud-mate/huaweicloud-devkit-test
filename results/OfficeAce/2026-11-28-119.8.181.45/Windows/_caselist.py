# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
t = open(p, encoding='utf-8').read()
# find all case id comment markers
for m in re.finditer(r'//\s*((?:D\d|EXP)-[\w-]+)\s*[:：]?\s*(.{0,80})', t):
    line_no = t[:m.start()].count('\n') + 1
    print(line_no, ':', m.group(1), '-', m.group(2).strip()[:76])
