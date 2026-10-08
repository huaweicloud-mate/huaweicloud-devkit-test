import csv, collections, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
def dump(fn, tag):
    f = open(fn, encoding='utf-8-sig')
    r = list(csv.DictReader(f))
    f.close()
    out = []
    out.append('=== %s rows=%d ===' % (fn, len(r)))
    out.append('pr=' + str(dict(collections.Counter(x.get('优先级', '') for x in r))))
    out.append('dim=' + str(dict(collections.Counter(x.get('维度', '') for x in r))))
    out.append('IDs:')
    for x in r:
        out.append('  %s | %s | %s' % (x.get('ID'), x.get('优先级'), x.get('标题')))
    open('_overview_%s.txt' % tag, 'w', encoding='utf-8').write('\n'.join(out))
    print('wrote', tag, len(r))
dump('用例矩阵-设计级.csv', 'des')
dump('用例矩阵-展开级.csv', 'exp')