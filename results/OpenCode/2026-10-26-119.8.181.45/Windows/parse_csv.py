import csv, os, sys
base = os.path.dirname(os.path.abspath(__file__))
# Expanded level
with open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
print(f'Expanded cases: {len(rows)}')
for r in rows:
    cid = r['ID']
    pri = r['优先级']
    dcid = r.get('designCaseId','')
    ecid = r.get('expandedCaseId','')
    agent = r.get('agent','')
    osv = r.get('OS','')
    steps = r.get('执行要求','')[:80]
    exp = r.get('预期结果','')[:80]
    print(f'  {cid}  P{pri}  design={dcid}  agent={agent} OS={osv}')
    print(f'    steps: {steps}')
    print(f'    expect: {exp}')
print()
# Design level summary
with open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    drows = list(reader)
print(f'Design cases: {len(drows)}')
prios = {}
for r in drows:
    p = r.get('优先级','?')
    prios[p] = prios.get(p, 0) + 1
print(f'  Priority breakdown: {prios}')
