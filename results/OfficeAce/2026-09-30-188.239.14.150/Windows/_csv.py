import csv, io, os
HERE = os.path.dirname(os.path.abspath(__file__))
design = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
expanded = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
print('design fields:', list(design[0].keys()))
print('design count:', len(design))
print('D IDs:', sorted(set(r['ID'] for r in design)))
print()
print('expanded fields:', list(expanded[0].keys()))
print('expanded count:', len(expanded))
for r in expanded:
    print(r['ID'], '|', r.get('优先级'), '|', r.get('agent'), '|', r.get('OS'))