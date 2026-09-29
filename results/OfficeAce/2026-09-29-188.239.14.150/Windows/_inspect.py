# AI生成 - inspect CSV status
import io, csv, collections, sys, os
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv', '需求-设计-证据追踪表.csv']:
    p = os.path.join(base, f)
    rows = list(csv.reader(io.open(p, encoding='utf-8-sig')))
    h = rows[0]
    si = h.index('执行状态') if '执行状态' in h else None
    ti = h.index('执行时间') if '执行时间' in h else None
    ei = h.index('evidencePath') if 'evidencePath' in h else None
    pi = h.index('优先级') if '优先级' in h else None
    print('=====', f, 'rows', len(rows)-1)
    print('hdr:', h)
    if si is not None:
        c = collections.Counter(r[si] for r in rows[1:])
        print('状态分布:', dict(c))
    # IDs + priority + status
    if si is not None and pi is not None:
        for r in rows[1:]:
            print(r[0], '|', r[pi], '|', r[si] if si < len(r) else '', '|', r[ti] if ti is not None and ti < len(r) else '')