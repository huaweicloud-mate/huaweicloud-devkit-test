import csv, os, io
base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, '_insp.txt'), 'w', encoding='utf-8')
for fn in sorted(os.listdir(base)):
    if fn.endswith('.csv'):
        rows = list(csv.reader(io.open(os.path.join(base, fn), encoding='utf-8-sig')))
        out.write('FILE %s rows=%d cols=%d\n' % (fn, len(rows), len(rows[0])))
        out.write('  header: %r\n' % (rows[0],))
        out.write('  sample: %r\n' % (rows[1],) if len(rows) > 1 else '')
out.close()
print('done')