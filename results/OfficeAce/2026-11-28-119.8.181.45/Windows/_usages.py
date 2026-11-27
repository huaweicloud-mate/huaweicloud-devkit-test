# -*- coding: utf-8 -*-
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261112.mjs'
t = open(p, encoding='utf-8').read()
vars = ['safetyPolicy','updateCheck','tools','mcpProtocol','detectFramework','riskRuleEngine','preflight','iconLibrary','koocliVersion','mcpConfigBackup','mcpConfigMerge','setupCli','authCredentials','authGuidance','authService','sandboxSession','proxyConfig','hcloudCli']
for v in vars:
    usages = re.findall(r'\b' + v + r'\??\.(\w+)', t)
    from collections import Counter
    c = Counter(usages)
    print(v, '->', dict(c) if usages else '(unused)')
