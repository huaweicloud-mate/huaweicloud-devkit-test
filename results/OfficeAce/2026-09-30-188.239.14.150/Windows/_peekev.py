import os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
E = os.path.join(HERE, 'evidence')
for d in sorted(os.listdir(E)):
    p = os.path.join(E, d)
    if not os.path.isdir(p):
        continue
    files = os.listdir(p)
    has_probe = 'probe.mjs' in files
    stdouts = [f for f in files if f.startswith('stdout')]
    print('%s | probe=%s | stdout=%s' % (d, has_probe, stdouts))