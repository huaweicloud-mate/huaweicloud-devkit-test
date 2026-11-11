# -*- coding: utf-8 -*-
import os, io, sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')
buf = io.StringIO()
home = os.path.expanduser('~')
# candidate credential sources
cands = [
    os.path.join(home, '.huaweicloud-devkit'),
    os.path.join(home, '.hcloud'),
    os.path.join(home, '.obsutilconfig'),
]
for c in cands:
    buf.write('%s exists=%s\n' % (c, os.path.exists(c)))
    if os.path.isdir(c):
        for root, dirs, files in os.walk(c):
            for f in files:
                fp = os.path.join(root, f)
                buf.write('   %s (%d)\n' % (os.path.relpath(fp, c), os.path.getsize(fp)))
# env vars (names only, values masked)
for k in sorted(os.environ.keys()):
    if any(s in k.upper() for s in ['HW_', 'HUAWEI', 'HDK', 'OPENGW', 'ACCESS', 'SECRET', 'AGENT_TOOLKIT', 'DSH', 'MCP']):
        v = os.environ[k]
        masked = (v[:4] + '...' + v[-2:]) if len(v) > 8 else '***'
        buf.write('ENV %s=%s (len %d)\n' % (k, masked, len(v)))
# hcloud CLI
try:
    r = subprocess.run(['hcloud', '--version'], capture_output=True, text=True, timeout=30, shell=True)
    buf.write('hcloud --version rc=%s out=%s\n' % (r.returncode, (r.stdout or r.stderr)[:200]))
except Exception as e:
    buf.write('hcloud CLI error: %s\n' % e)
# koo cli config dir
kc = os.path.join(home, '.hcloud')
if os.path.isdir(kc):
    for f in os.listdir(kc):
        buf.write('  .hcloud/%s\n' % f)
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_creds.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
