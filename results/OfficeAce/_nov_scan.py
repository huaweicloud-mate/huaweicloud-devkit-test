# -*- coding: utf-8 -*-
import os, sys, io
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce'
dirs = sorted([d for d in os.listdir(base) if d.startswith('2026-11')])
for d in dirs:
    p = os.path.join(base, d)
    for sub in os.listdir(p):
        sp = os.path.join(p, sub)
        if os.path.isdir(sp):
            has_ev = 'evidence' in os.listdir(sp)
            files = os.listdir(sp)
            report = [f for f in files if '测试报告' in f or 'FINDINGS' in f]
            print(d, sub, 'evidence=' + str(has_ev), 'report=' + str(report[:2]))
        else:
            print(d, sub, '(file)')
