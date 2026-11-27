# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
lines = open(p, encoding='utf-8').read().splitlines()
pats = ['classifyCommand', 'checkArtifacts', 'checkDeployPlan', 'resolveManagedProfile', 'persistCredentials', 'setRuntimeActive', 'syncCredentials', 'backupCredentials', 'authSwitch', 'queryDistTags']
for i, l in enumerate(lines, 1):
    for pat in pats:
        if pat in l:
            print(f'{i}: {l.strip()[:200]}')
            break
