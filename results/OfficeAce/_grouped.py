import os, io, sys, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
YEST = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence'
out = []
for g in ['c4-service-matrix','d1-upgrade','d2-auth','d4-security','mcp-tools']:
    p = os.path.join(YEST, g)
    out.append('===== %s =====' % g)
    if os.path.isdir(p):
        for f in sorted(os.listdir(p)):
            fp = os.path.join(p, f)
            out.append('  %s (%d bytes)' % (f, os.path.getsize(fp) if os.path.isfile(fp) else -1))
        # if there's a stdout.log or probe-summary, dump head
        for f in ['probe.mjs','stdout.log']:
            fp = os.path.join(p,f)
            if os.path.isfile(fp):
                out.append('  --- %s head ---' % f)
                out.append(open(fp,encoding='utf-8',errors='replace').read()[:800])
    else:
        out.append('  (not a dir)')
open('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/_grouped.txt','w',encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))