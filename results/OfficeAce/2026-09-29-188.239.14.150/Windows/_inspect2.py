import io, csv, os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
for f in ['用例矩阵-展开级.csv', '需求-设计-证据追踪表.csv']:
    p = os.path.join(base, f)
    rows = list(csv.reader(io.open(p, encoding='utf-8-sig')))
    print('=====', f, 'rows(data)', len(rows)-1)
    print('hdr:', rows[0])
    # print all IDs + priority + status
    h = rows[0]
    si = h.index('执行状态') if '执行状态' in h else None
    pi = h.index('优先级') if '优先级' in h else None
    for r in rows[1:]:
        print(r[0], '|', (r[pi] if pi is not None else ''), '|', (r[si] if (si is not None and si < len(r)) else ''))