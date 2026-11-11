# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\eval\harness\run-eval.mjs'
t = io.open(p, encoding='utf-8', errors='replace').read()
lines = t.splitlines()
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_run_eval.txt','w',encoding='utf-8').write('\n'.join(lines[:120]))
p2 = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\eval\harness\protocol-probe.mjs'
t2 = io.open(p2, encoding='utf-8', errors='replace').read()
l2 = t2.splitlines()
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_protocol_probe.txt','w',encoding='utf-8').write('\n'.join(l2[:150]))
print('ok', len(lines), len(l2))
