import os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
E = os.path.join(HERE, 'evidence')
rows = []
for d in sorted(os.listdir(E)):
    p = os.path.join(E, d)
    if not os.path.isdir(p):
        continue
    files = sorted(os.listdir(p))
    rows.append('%s :: %s' % (d, ', '.join(files)))
open(os.path.join(HERE, '_evidence_files.txt'), 'w', encoding='utf-8').write('\n'.join(rows))
print('done', len(rows))