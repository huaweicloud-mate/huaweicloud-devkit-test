# -*- coding: utf-8 -*-
import io, sys, collections
sys.stdout.reconfigure(encoding='utf-8')
t = io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_alldesign.txt', encoding='utf-8').read()
lines = t.splitlines()
groups = collections.OrderedDict()
for l in lines:
    p = l.split('|')[0].split('-')[0]
    groups.setdefault(p, []).append(l.split('|')[0])
buf = io.StringIO()
for k, v in groups.items():
    buf.write('%s (%d): %s\n' % (k, len(v), ','.join(v)))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_groups.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
