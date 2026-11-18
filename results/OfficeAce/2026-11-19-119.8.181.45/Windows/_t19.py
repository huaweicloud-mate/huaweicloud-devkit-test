# -*- coding: utf-8 -*-
import os, re, sys, glob, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
D = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts'
cov = {}
for f in glob.glob(os.path.join(D, '*.mjs')) + glob.glob(os.path.join(D, '*.py')):
    try:
        t = open(f, encoding='utf-8', errors='replace').read()
    except Exception:
        continue
    ids = set(re.findall(r"writeResult\('([^']+)'", t))
    if not ids:
        ids = set(re.findall(r"caseId['\"]?\s*[:=]\s*['\"]([A-Z0-9\-]+)['\"]", t))
    for i in ids:
        cov.setdefault(i, []).append(os.path.basename(f))
# 目标146
design_ids = ['D1-3','D1-4','D1-26','D1-27','D1-28','D1-30','D1-31','D1-33','D1-39','D1-40','D1-41','D1-42','D1-45','D1-65','D1-66','D1-67','D1-68','D1-69','D1-70']
print('sample D2-30 covered by:', cov.get('D2-30'))
print('sample D6-10 covered by:', cov.get('D6-10'))
print('sample D8-2 covered by:', cov.get('D8-2'))
print('sample D9-3 covered by:', cov.get('D9-3'))
print('sample D10-1 covered by:', cov.get('D10-1'))
print('sample D3-A2 covered by:', cov.get('D3-A2'))
print('sample D2-53 covered by:', cov.get('D2-53'))
print('sample EXP-E01 covered by:', cov.get('EXP-E01'))
print('sample EXP-E04 covered by:', cov.get('EXP-E04'))
print('total distinct ids in scripts:', len(cov))
