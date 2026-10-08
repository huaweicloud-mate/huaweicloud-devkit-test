import os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ev = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence'
out = []
for f in ['_gen-evidence.mjs','_helper.mjs','_run-all-p1.mjs','probe-c4-batch.mjs','probe-c4.mjs','probe-summary.json']:
    p = os.path.join(ev, f)
    out.append('===== %s (%d bytes) =====' % (f, os.path.getsize(p) if os.path.isfile(p) else -1))
    if os.path.isfile(p):
        out.append(open(p, encoding='utf-8', errors='replace').read()[:1500])
open('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/_gen_inspect.txt','w',encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))