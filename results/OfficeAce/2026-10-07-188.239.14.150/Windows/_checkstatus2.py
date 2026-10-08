import csv, os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-07-188.239.14.150\Windows'
for f in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv','需求-设计-证据追踪表.csv']:
    path = os.path.join(base, f)
    rows = list(csv.reader(open(path, encoding='utf-8-sig')))
    hdr = rows[0]
    idx_id = hdr.index('ID') if 'ID' in hdr else hdr.index('expandedCaseId')
    idx_st = hdr.index('执行状态') if '执行状态' in hdr else None
    idx_ep = hdr.index('evidencePath') if 'evidencePath' in hdr else None
    idx_t = hdr.index('执行时间') if '执行时间' in hdr else None
    from collections import Counter
    cstat = Counter()
    cpassed = Counter()
    filled = 0
    empty = 0
    print('====', f, 'rows', len(rows)-1)
    for r in rows[1:]:
        st = (r[idx_st].strip() if idx_st is not None and len(r)>idx_st else '')
        cstat[st] += 1 if st else 0
        if st: filled += 1
        else: empty += 1
    print('  执行状态分布:', dict(cstat), 'filled', filled, 'empty', empty)
    # print sample rows
    for r in rows[1:4]:
        print('  ', r[0], '|', (r[idx_st] if idx_st is not None else '?'), '|', (r[idx_ep] if idx_ep is not None else '?'))