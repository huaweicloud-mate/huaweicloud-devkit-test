# -*- coding: utf-8 -*-
import sys, os, re
sys.stdout.reconfigure(encoding='utf-8')
src = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src'
pats = ['managed profile', 'resolveManagedProfile', 'artifacts', 'deploy', 'auth_switch', 'authSwitch', 'runtime', 'suppress', 'R10', 'configuredBySession', 'R9']
for f in ['auth/reconcile.ts', 'auth/credentials.ts', 'auth/service.ts', 'auth/runtime-credentials.ts', 'preflight.ts']:
    p = os.path.join(src, f)
    if not os.path.exists(p):
        print(f, 'MISSING'); continue
    t = open(p, encoding='utf-8', errors='ignore').read()
    exports = re.findall(r'export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)', t)
    print('=====', f, len(exports), 'exports =====')
    print(', '.join(exports))
