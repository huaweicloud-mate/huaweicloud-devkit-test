# -*- coding: utf-8 -*-
import os, re, sys, glob
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
D = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts'
pat_ids = re.compile(r"['\"]((?:EXP-[A-Z0-9\-]+|D3-S\d|D9-[3-8]))['\"]")
hits = {}
for f in glob.glob(os.path.join(D, '*')):
    if not os.path.isfile(f):
        continue
    try:
        t = open(f, encoding='utf-8', errors='replace').read()
    except Exception:
        continue
    ids = set(pat_ids.findall(t))
    if ids:
        hits[os.path.basename(f)] = sorted(ids)
for k, v in sorted(hits.items()):
    print(k, len(v), v[:8], '...' if len(v) > 8 else '')
