# -*- coding: utf-8 -*-
"""把参考客户端(Codex) grouped 探针复制到 OfficeAce 本日 evidence，路径改写为 hdk 源码。"""
import sys, os, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, 'scripts'))
import reuse_probes as RP

SRC_EV = os.path.join(REPO, 'results', 'Codex', '2026-11-17-10.1.8.13', 'Windows', 'evidence')
DST_EV = os.path.join(REPO, 'results', 'OfficeAce', '2026-11-19-119.8.181.45', 'Windows', 'evidence')

hdk = RP.detect_hdk_path()
print('hdk =', hdk)
copied = 0
for g in RP.GROUPED:
    p = os.path.join(SRC_EV, g, 'probe.mjs')
    if not os.path.isfile(p):
        print('missing', g)
        continue
    text = open(p, encoding='utf-8').read()
    new = RP.rewrite_probe(text, hdk, DST_EV, 'Windows', 'OfficeAce')
    dst = os.path.join(DST_EV, g, 'probe.mjs')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(new)
    print('copied', g, len(new), 'bytes')
    copied += 1
print('done', copied)
