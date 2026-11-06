import csv, glob, os
for f in glob.glob('*.csv'):
    r = list(csv.reader(open(f, encoding='utf-8-sig')))
    print('===', f, 'rows', len(r))
    print('hdr:', r[0])