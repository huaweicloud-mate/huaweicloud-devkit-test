import csv, os, json, glob
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows'
evdir = os.path.join(base, 'evidence')
logs = []
for d in sorted(os.listdir(evdir)):
    p = os.path.join(evdir, d)
    if os.path.isdir(p):
        sl = os.path.join(p, 'stdout.log')
        if os.path.isfile(sl):
            try:
                obj = json.load(open(sl, encoding='utf-8'))
                st = obj.get('status') if isinstance(obj, dict) else '?'
            except Exception as e:
                st = 'PARSE_ERR:' + str(e)[:30]
        else:
            st = 'NO_LOG'
        logs.append('%s -> %s' % (d, st))
open(os.path.join(base, '_evlog.txt'), 'w', encoding='utf-8').write('\n'.join(logs))
print('evidence dirs with log state:')
print('\n'.join(logs))