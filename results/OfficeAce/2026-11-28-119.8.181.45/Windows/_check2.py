# -*- coding: utf-8 -*-
import sys, os, re
sys.stdout.reconfigure(encoding='utf-8')
src = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src'
for f in ['auth/error-table.ts', 'auth/missing-credential-error.ts', 'auth/credential-validator.ts']:
    p = os.path.join(src, f)
    t = open(p, encoding='utf-8', errors='ignore').read()
    exports = re.findall(r'export\s+(?:async\s+)?(?:function|const|class|interface|type)\s+(\w+)', t)
    print('=====', f, '=====')
    print(', '.join(exports))
    # show signature of validateIamCredentials
    m = re.search(r'export\s+(?:async\s+)?function\s+validateIamCredentials[\s\S]{0,300}', t)
    if m: print(m.group(0)[:300])
    print()
# hardcoded paths in runner
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
lines = open(p, encoding='utf-8').read().splitlines()
for i, l in enumerate(lines, 1):
    if '2026-11-12' in l or '2026-11-11' in l or 'mcp-server' in l:
        print(f'RUNNER {i}:', l.strip()[:160])
