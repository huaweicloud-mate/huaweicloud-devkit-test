# -*- coding: utf-8 -*-
import io, sys, os
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261107.mjs'
t = io.open(p, encoding='utf-8', errors='replace').read()
lines = t.splitlines()
buf = io.StringIO()
import re
for i, l in enumerate(lines):
    if re.search(r'D3-C1|D3-C2|D3-C7|D3-S4|EXP-C4-0|realcloud|spawnSync\(.?hcloud|runHcloud', l):
        buf.write('%d: %s\n' % (i+1, l))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_br_hits.txt','w',encoding='utf-8').write(buf.getvalue())
# also cred files
for f in [r'C:\Users\Administrator\.config\huaweicloud\credentials.json', r'C:\Users\Administrator\.config\huaweicloud\credentials.readonly.json']:
    buf.write('%s exists=%s\n' % (f, os.path.exists(f)))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_br_hits2.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
