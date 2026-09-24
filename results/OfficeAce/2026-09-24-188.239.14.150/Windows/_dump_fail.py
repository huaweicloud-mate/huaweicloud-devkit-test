import io, sys
sys.stdout.reconfigure(encoding='utf-8')
for cid in ['D4-16','D4-28','D4-2','EXP-E01','EXP-E06','EXP-E09','EXP-E15']:
    p = 'evidence/%s/stdout.log' % cid
    raw = io.open(p, encoding='utf-8').read().strip().lstrip('\ufeff')
    print('==== %s (%d) ====' % (cid, len(raw)))
    print(raw)
    print()