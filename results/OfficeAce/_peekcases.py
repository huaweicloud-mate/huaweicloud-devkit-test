import os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
YEST = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence'
out = []
for c in ['EXP-C4-01','D5-1','D5-3','D6-1','D9-1','D8-1','D1-40','D4-13','D10-3','D10-4']:
    d = os.path.join(YEST, c)
    out.append('===== %s =====' % c)
    for f in ['probe.mjs','stdout.log']:
        fp = os.path.join(d, f)
        if os.path.isfile(fp):
            t = open(fp, encoding='utf-8', errors='replace').read()
            out.append('--- %s (%d bytes) ---' % (f, len(t)))
            out.append(t[:900])
open('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/_peekcases.txt','w',encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))