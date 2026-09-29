import csv, os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows'
from collections import Counter
for fn in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    p = os.path.join(base, fn)
    rows = list(csv.DictReader(open(p, encoding='utf-8-sig')))
    st = Counter((x.get('执行状态') or '').strip() for x in rows)
    print('==== %s (total %d) ====' % (fn, len(rows)))
    print('STATUS: ' + str(dict(st)))
    # 列出已回填状态的
    filled = [x for x in rows if (x.get('执行状态') or '').strip()]
    print('已回填 %d 条' % len(filled))
    empty = [x['ID'] for x in rows if not (x.get('执行状态') or '').strip()]
    print('未回填 IDs: %s' % empty)