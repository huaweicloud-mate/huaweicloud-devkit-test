# -*- coding: utf-8 -*-
import os, io, sys
sys.stdout.reconfigure(encoding='utf-8')
ev = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-07-119.8.181.45\Windows\evidence'
buf = io.StringIO()
for cid in ['D3-C1','D3-C7','D3-S4','EXP-C4-01','EXP-C4-05','EXP-C4-11','EXP-E02','EXP-E01','D2-11','D2-16','D4-6','D4-8','D1-70','D3-C13']:
    d = os.path.join(ev, cid)
    buf.write('==== %s ====\n' % cid)
    if not os.path.isdir(d):
        buf.write('  MISSING\n'); continue
    for fn in sorted(os.listdir(d)):
        fp = os.path.join(d, fn)
        if os.path.isfile(fp):
            sz = os.path.getsize(fp)
            buf.write('  %s (%d)\n' % (fn, sz))
            if sz < 3000 and (fn.endswith(('.log','.txt','.json'))):
                t = io.open(fp, encoding='utf-8', errors='replace').read()
                buf.write('    >> %s\n' % t[:1500].replace('\n','\n    '))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_prev_ev2.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
