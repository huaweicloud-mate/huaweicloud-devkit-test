# -*- coding: utf-8 -*-
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
src = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-07-119.8.181.45\Windows\evidence'
out = io = None
import io
buf = io.StringIO()
for cid in ['D2-4', 'D4-3', 'D1-39']:
    d = os.path.join(src, cid)
    buf.write('==== %s ====\n' % cid)
    for f in os.listdir(d):
        fp = os.path.join(d, f)
        buf.write('  %s (%d bytes)\n' % (f, os.path.getsize(fp)))
    # print first 60 lines of probe
    for fn in os.listdir(d):
        if fn == 'probe.mjs':
            t = io.open(os.path.join(d, fn), encoding='utf-8', errors='replace').read()
            lines = t.splitlines()
            buf.write('--- probe.mjs head ---\n')
            buf.write('\n'.join(lines[:45]) + '\n')
            buf.write('--- probe.mjs tail ---\n')
            buf.write('\n'.join(lines[-25:]) + '\n')
        if fn.startswith('stdout'):
            t = io.open(os.path.join(d, fn), encoding='utf-8', errors='replace').read()
            buf.write('--- %s ---\n%s\n' % (fn, t[:1200]))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_probe_sample.txt', 'w', encoding='utf-8').write(buf.getvalue())
print('ok')
