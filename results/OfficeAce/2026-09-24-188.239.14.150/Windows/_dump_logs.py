import io, glob, sys
sys.stdout.reconfigure(encoding='utf-8')
for p in sorted(glob.glob('evidence/*/stdout.log')):
    raw = io.open(p, encoding='utf-8').read().strip()
    print('==== %s (%d bytes) ====' % (p, len(raw)))
    print(raw[:400])
    print()