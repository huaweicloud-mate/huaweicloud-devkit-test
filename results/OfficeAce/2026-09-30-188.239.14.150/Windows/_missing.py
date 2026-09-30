import os
EVID = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evidence')
missing = []
for cid in sorted(os.listdir(EVID)):
    d = os.path.join(EVID, cid)
    if not os.path.isdir(d):
        continue
    if os.path.exists(os.path.join(d, 'probe.mjs')) and not os.path.exists(os.path.join(d, 'stdout.log')):
        missing.append(cid)
print('missing stdout.log count:', len(missing))
print(' '.join(missing))