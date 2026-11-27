# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
lines = open(p, encoding='utf-8').read().splitlines()
for i, l in enumerate(lines, 1):
    if 'checkArtifacts' in l or 'checkDeployPlan' in l or 'backupCredentials' in l or 'restoreCredentials' in l or 'writeSkipState' in l:
        print(f'{i}: {l.strip()[:180]}')
