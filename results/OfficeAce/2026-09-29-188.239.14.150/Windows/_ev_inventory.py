# -*- coding: utf-8 -*-
import os, io
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
dirs = [d for d in os.listdir(ev) if os.path.isdir(os.path.join(ev, d))]
dirs.sort()
lines = ['total dirs %d' % len(dirs)]
for d in dirs:
    p = os.path.join(ev, d)
    fs = os.listdir(p)
    has_mjs = any(f.endswith('.mjs') for f in fs)
    out = [f for f in fs if f in ('stdout.log', 'stdout.txt')]
    sz = sum(os.path.getsize(os.path.join(p, f)) for f in out if os.path.isfile(os.path.join(p, f)))
    lines.append('%-20s mjs=%s stdout=%s size=%d files=%s' % (d, has_mjs, bool(out), sz, ','.join(fs)))
with io.open(os.path.join(base, '_ev_inventory.txt'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('done', len(dirs))