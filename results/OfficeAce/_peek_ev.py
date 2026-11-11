# -*- coding: utf-8 -*-
import os, io, sys
sys.stdout.reconfigure(encoding='utf-8')
ev = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-07-119.8.181.45\Windows\evidence'
buf = io.StringIO()
for cid in ['D3-C1','D3-C2','D3-C5','D2-1','D4-1','D4-4','D4-13','D6-4','D8-9','EXP-C4-01','EXP-E02','D4-23']:
    d = os.path.join(ev, cid)
    if not os.path.isdir(d):
        buf.write('%s MISSING\n' % cid); continue
    buf.write('==== %s ====\n' % cid)
    for f in sorted(os.listdir(d)):
        fp = os.path.join(d, f)
        if os.path.isfile(fp):
            buf.write('  %s (%d)\n' % (f, os.path.getsize(fp)))
    for fn in os.listdir(d):
        fp = os.path.join(d, fn)
        if os.path.isfile(fp) and (fn.endswith('.mjs')) and os.path.getsize(fp) > 400:
            t = io.open(fp, encoding='utf-8', errors='replace').read()
            buf.write('  --- %s (head 20 lines) ---\n' % fn)
            buf.write('\n'.join('    '+l for l in t.splitlines()[:20]) + '\n')
        if os.path.isfile(fp) and (fn.endswith('.log') or fn.endswith('.txt') or fn.endswith('.json')):
            t = io.open(fp, encoding='utf-8', errors='replace').read()
            buf.write('  --- %s (first 900 chars) ---\n%s\n' % (fn, t[:900]))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_prev_evidence.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
