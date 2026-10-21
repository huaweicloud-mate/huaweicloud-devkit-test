import csv, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
with open('用例矩阵-设计级.csv', encoding='utf-8-sig') as fh:
    rows = list(csv.DictReader(fh))
p0 = [r for r in rows if r.get('优先级')=='P0']
print('===== DESIGN P0 (%d) =====' % len(p0))
for r in p0:
    print(r['ID'], '|', r.get('终端覆盖类型',''), '|', r.get('agent','')[:30], '|', r.get('OS','')[:25], '|', r.get('标题',''))
print()
print('===== DESIGN P1 (%d) =====' % len([r for r in rows if r.get('优先级')=='P1']))
for r in rows:
    if r.get('优先级')=='P1':
        print(r['ID'], '|', r.get('终端覆盖类型',''), '|', r.get('标题','')[:50])
print()
print('===== DESIGN P2 (%d) =====' % len([r for r in rows if r.get('优先级')=='P2']))
for r in rows:
    if r.get('优先级')=='P2':
        print(r['ID'], '|', r.get('终端覆盖类型',''), '|', r.get('标题','')[:50])