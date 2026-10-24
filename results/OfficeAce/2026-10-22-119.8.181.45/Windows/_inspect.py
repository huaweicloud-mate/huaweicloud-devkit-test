import glob, csv, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
for f in sorted(glob.glob('*.csv')):
    with open(f, encoding='utf-8-sig') as fh:
        hdr = next(csv.reader(fh))
        rows = list(csv.reader(fh))
    print('==== FILE:', f)
    print('COLS:', hdr)
    print('NROWS:', len(rows))
    print()