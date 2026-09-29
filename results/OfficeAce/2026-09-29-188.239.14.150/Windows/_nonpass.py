import os, json
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\evidence'
rows = []
nolog = []
for d in sorted(os.listdir(base)):
    p = os.path.join(base, d)
    if os.path.isdir(p):
        sl = os.path.join(p, 'stdout.log')
        if os.path.isfile(sl):
            try:
                obj = json.load(open(sl, encoding='utf-8'))
                st = obj.get('status') if isinstance(obj, dict) else '?'
            except Exception:
                st = 'ERR'
        else:
            st = 'NO_LOG'
            nolog.append(d)
        if st != 'PASS':
            rows.append('%s -> %s' % (d, st))
out = ['non-PASS (%d):' % len(rows)] + rows + ['', 'NO_LOG (%d):' % len(nolog)] + nolog
open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\_nonpass.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))