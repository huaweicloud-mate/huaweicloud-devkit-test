import csv, json
f = '用例矩阵-设计级.csv'
rows = list(csv.reader(open(f, encoding='utf-8-sig')))
hdr = rows[0]
idx = {h: i for i, h in enumerate(hdr)}
from collections import Counter
c = Counter(r[idx['执行状态']] for r in rows[1:])
d = {'cols': len(hdr), 'rows': len(rows)-1, 'status': dict(c)}
print(json.dumps(d, ensure_ascii=False))