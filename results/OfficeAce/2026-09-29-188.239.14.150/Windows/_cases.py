import io, csv, os, sys, collections
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))

def dump(fname, tag):
    p = os.path.join(base, fname)
    rows = list(csv.DictReader(io.open(p, encoding='utf-8-sig')))
    h = list(rows[0].keys())
    idc = 'ID'
    pric = '优先级' if '优先级' in h else ('priority' if 'priority' in h else None)
    titlec = '标题' if '标题' in h else ('枚举对象' if '枚举对象' in h else None)
    cnt = collections.Counter(r.get(pric) for r in rows)
    print('=====', tag, '总数', len(rows), '优先级分布', dict(cnt))
    for r in rows:
        print(r.get(idc), '|', r.get(pric), '|', (r.get(titlec) or '').replace('\n',' ')[:60])

dump('用例矩阵-设计级.csv', '设计级')
print()
dump('用例矩阵-展开级.csv', '展开级')