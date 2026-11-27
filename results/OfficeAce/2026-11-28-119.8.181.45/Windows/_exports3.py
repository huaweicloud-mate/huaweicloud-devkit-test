# -*- coding: utf-8 -*-
import sys, os, re
sys.stdout.reconfigure(encoding='utf-8')
src = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src'
# find risk/deploys/artifacts related modules
for f in ['hcloud-plan.ts', 'risk-rule-engine.ts', 'hcloud-run.ts', 'safety-policy.ts', 'auth/credential-validator.ts', 'auth/credential-resolver.ts', 'auth/runtime-credentials.ts']:
    p = os.path.join(src, f)
    if not os.path.exists(p):
        print(f, 'MISSING'); continue
    t = open(p, encoding='utf-8', errors='ignore').read()
    exports = re.findall(r'export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)', t)
    print('=====', f, '=====')
    print(', '.join(exports))
    print()
