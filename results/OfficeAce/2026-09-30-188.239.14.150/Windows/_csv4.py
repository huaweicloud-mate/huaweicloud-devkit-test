import csv, io, os
HERE = os.path.dirname(os.path.abspath(__file__))
expanded = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
for r in expanded:
    officeace = 'OfficeAce' in r['agent']
    print(f"{r['ID']:14s} {r['优先级']:3s} officeace={officeace} agent={r['agent'][:40]!r}")
print()
# check execution status column already filled?
print('sample expanded row keys:', list(expanded[0].keys()))
for r in expanded:
    if r['ID'].startswith('EXP-D5') or r['ID']=='EXP-E01':
        print(r['ID'], '执行状态=', repr(r.get('执行状态')), 'evidencePath=', repr(r.get('evidencePath')))