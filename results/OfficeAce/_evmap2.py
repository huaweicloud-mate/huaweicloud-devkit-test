import os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ev = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence'
evdirs = sorted(os.listdir(ev))
lines = []
for d in evdirs:
    p = os.path.join(ev, d)
    files = sorted(os.listdir(p)) if os.path.isdir(p) else ['<file>']
    hasprobe = 'probe.mjs' in files
    haslog = 'stdout.log' in files
    lines.append('%-16s probe=%s log=%s' % (d, hasprobe, haslog))
open('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/_evmap_out.txt','w',encoding='utf-8').write('\n'.join(lines))
print('\n'.join(lines))