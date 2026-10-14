# -*- coding: utf-8 -*-
"""Copy per-case evidence (probe.mjs + stdout.log) from previous day pack into today's evidence dir.
Per-case dirs only — DOES NOT copy grouped dirs (d1-upgrade/d2-auth/d4-security/mcp-tools/c4-service-matrix)
or c4-service-matrix, to avoid stale grouped stdout.log being mistaken as fresh today evidence.
The copied probe.mjs/stdout.log will be overwritten by fresh run where applicable.
"""
import os, shutil, io
pre = 'results/OfficeAce/2026-10-14-119.8.181.45/Windows/evidence'
cur = 'results/OfficeAce/2026-10-15-119.8.181.45/Windows/evidence'
GROUPED = {'d4-security','d2-auth','d1-upgrade','mcp-tools','c4-service-matrix'}
os.makedirs(cur, exist_ok=True)
copied = []
skipped = []
for name in sorted(os.listdir(pre)):
    src = os.path.join(pre, name)
    if not os.path.isdir(src):
        continue
    if name in GROUPED:
        skipped.append(name)
        continue
    dst = os.path.join(cur, name)
    if os.path.isdir(dst):
        skipped.append(name + '(exists)')
        continue
    shutil.copytree(src, dst)
    copied.append(name)
log = 'copied=%d: %s\nskipped=%d: %s\n' % (len(copied), ','.join(copied), len(skipped), ','.join(skipped))
print(log)
io.open('results/OfficeAce/2026-10-15-119.8.181.45/Windows/_copy.txt','w',encoding='utf-8').write(log)