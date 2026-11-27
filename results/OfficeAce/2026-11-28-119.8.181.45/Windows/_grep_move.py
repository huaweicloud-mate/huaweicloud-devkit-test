# -*- coding: utf-8 -*-
import sys, os, re
sys.stdout.reconfigure(encoding='utf-8')
src = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src'
dist = src.replace('\\src', '\\dist')
# grep for moved functions in src ts files
pats = ['resolveManagedProfile', 'authSwitch', 'checkArtifacts', 'checkDeployPlan', 'persistCredentials', 'setRuntimeActive', 'syncCredentials', 'backupCredentials']
for pat in pats:
    hits = []
    for root, dirs, files in os.walk(src):
        for f in files:
            if f.endswith('.ts'):
                p = os.path.join(root, f)
                try:
                    t = open(p, encoding='utf-8', errors='ignore').read()
                except: continue
                for i, l in enumerate(t.splitlines(), 1):
                    if re.search(r'(export\s+(async\s+)?function\s+' + pat + r'\b|export\s+const\s+' + pat + r'\b)', l):
                        hits.append((os.path.relpath(p, src), i))
    print(pat, '->', hits if hits else 'NOT FOUND as export')
