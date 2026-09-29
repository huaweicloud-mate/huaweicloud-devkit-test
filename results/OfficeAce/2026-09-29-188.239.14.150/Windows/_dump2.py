import csv
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\用例矩阵-展开级.csv'
rows = list(csv.DictReader(open(p, encoding='utf-8-sig')))
out = ['EXPAND total %d' % len(rows)]
for x in rows:
    out.append('%s|%s|agent=%s|OS=%s|term=%s|src=%s|要点=%s' % (
        x['ID'], x['优先级'], x['agent'], x['OS'], x['terminal'], x.get('源用例'), (x['执行要点'] or '')[:60]))
open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\_expand_full.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('ok')