# -*- coding: utf-8 -*-
"""修复 probe.mjs 里残留的 Codex 机器 hdk 路径"""
import io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
ev = os.path.join(REPO, 'results', 'OfficeAce', '2026-11-19-119.8.181.45', 'Windows', 'evidence')
for g in ['d4-security', 'd2-auth', 'd1-upgrade', 'mcp-tools', 'c4-service-matrix']:
    p = os.path.join(ev, g, 'probe.mjs')
    t = open(p, encoding='utf-8').read()
    n = (t.replace('devkit-test/Codex/hdk', 'devkit-test/OfficeAce/hdk')
           .replace('devkit-test\\\\Codex\\\\hdk', 'devkit-test\\\\OfficeAce\\\\hdk')
           .replace('devkit-test\\Codex\\hdk', 'devkit-test\\OfficeAce\\hdk'))
    open(p, 'w', encoding='utf-8').write(n)
    print(g, 'changed' if t != n else 'same', 'Codex remains:', 'Codex' in n)
