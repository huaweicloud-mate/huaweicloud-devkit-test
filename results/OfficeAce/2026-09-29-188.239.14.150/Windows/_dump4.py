import csv
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\用例矩阵-设计级.csv'
rows = list(csv.DictReader(open(p, encoding='utf-8-sig')))
out = ['DESIGN total %d' % len(rows)]
for x in rows:
    out.append('%s|%s|%s|term=%s|agent=%s|OS=%s|requiredEvidence=%s' % (
        x['ID'], x['优先级'], (x['标题'] or '')[:34], (x['terminal'] or '')[:26], (x['agent'] or '')[:30], (x['OS'] or '')[:30], (x['requiredEvidence'] or '')[:46]))
open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\_design_all.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('ok')