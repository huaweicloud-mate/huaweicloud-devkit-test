import csv, os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
YEST = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows'
TOP = os.path.dirname(YEST)

ev = os.path.join(YEST, 'evidence')
evdirs = sorted(os.listdir(ev))

# per-case probe dirs vs grouped dirs
print('evidence dirs count:', len(evdirs))
for d in evdirs:
    p = os.path.join(ev, d)
    files = sorted(os.listdir(p)) if os.path.isdir(p) else []
    hasprobe = 'probe.mjs' in files
    haslog = 'stdout.log' in files
    if hasprobe or haslog:
        print('%-18s probe=%s log=%s files=%s' % (d, hasprobe, haslog, files))