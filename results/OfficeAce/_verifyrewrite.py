import os, io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
TODAY = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-01-188.239.14.150/Windows/evidence'
out = []
bad = []
for d in sorted(os.listdir(TODAY)):
    p = os.path.join(TODAY, d, 'probe.mjs')
    if not os.path.isfile(p):
        continue
    t = open(p, encoding='utf-8', errors='replace').read()
    if '09-30' in t or '2026-09-30' in t:
        bad.append(d)
    # check it contains today date references anywhere (for probes that had yest)
    cnt_today = t.count('2026-10-01')
out.append('probes still referencing 09-30: %d' % len(bad))
for b in bad:
    out.append('  BAD: %s' % b)
open('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/_verifyrewrite.txt','w',encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))