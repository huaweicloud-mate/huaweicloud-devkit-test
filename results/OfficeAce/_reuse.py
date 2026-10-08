import os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
YEST = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows'
TODAY = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-01-188.239.14.150/Windows'
EVD = os.path.join(TODAY, 'evidence')
os.makedirs(EVD, exist_ok=True)
evs = os.path.join(YEST, 'evidence')

def rewrite(t):
    t = t.replace('2026-09-30', '2026-10-01')
    t = t.replace('20260930', '20261001')
    t = t.replace('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30', 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-01')
    return t

copied = 0
for d in sorted(os.listdir(evs)):
    sp = os.path.join(evs, d, 'probe.mjs')
    if not os.path.isfile(sp):
        continue
    src = open(sp, encoding='utf-8', errors='replace').read()
    dst = os.path.join(EVD, d)
    os.makedirs(dst, exist_ok=True)
    open(os.path.join(dst, 'probe.mjs'), 'w', encoding='utf-8').write(rewrite(src))
    copied += 1
print('copied probes:', copied)

# verify no 09-30 remains
bad = 0
for d in sorted(os.listdir(EVD)):
    p = os.path.join(EVD, d, 'probe.mjs')
    if os.path.isfile(p):
        t = open(p, encoding='utf-8', errors='replace').read()
        if '2026-09-30' in t or '09-30' in t:
            bad += 1
            print('STILL BAD:', d)
print('probes still referencing 09-30:', bad)