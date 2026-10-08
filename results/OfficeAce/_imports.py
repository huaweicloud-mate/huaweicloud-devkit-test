import os, io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ev = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence'
imports = {}
for d in os.listdir(ev):
    p = os.path.join(ev, d, 'probe.mjs')
    if os.path.isfile(p):
        t = open(p, encoding='utf-8', errors='replace').read()
        found = re.findall(r'from\s+[\'"]([^\'"]+)[\'"]', t) + re.findall(r'import\s*\(\s*[\'"]([^\'"]+)[\'"]', t) + re.findall(r'import\s+[\'"]([^\'"]+)[\'"]', t)
        imports.setdefault(d, []).extend(found)
out = []
for d in sorted(imports):
    imp = imports[d]
    # categorize
    ext = [i for i in imp if not (i.startswith('C:') or i.startswith('file:') or i.startswith('.') or i.startswith('node:') or i.startswith('/'))]
    src = [i for i in imp if ('devkit-test' in i or 'hdk' in i or 'C:' in i)]
    out.append('%s | ext=%s | srcRefs=%d' % (d, ext, len(src)))
open('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/_imports.txt','w',encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))