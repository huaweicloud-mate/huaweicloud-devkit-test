import csv, io, glob, sys, os
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-18-119.8.181.45\Windows')
out = io.open('_pkg_info.txt', 'w', encoding='utf-8')
for f in glob.glob('*.csv'):
    rows = list(csv.DictReader(io.open(f, encoding='utf-8-sig')))
    out.write(f'== {f} rows={len(rows)}\n')
    if rows:
        out.write('cols: ' + ','.join(rows[0].keys()) + '\n')
        from collections import Counter
        for col in ('优先级', '执行状态', 'agent', 'OS'):
            if col in rows[0]:
                out.write(f'{col}: ' + str(Counter(r.get(col) for r in rows)) + '\n')
out.close()
print('done')
