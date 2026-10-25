import csv, os, json
base = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

cases = []
for r in rows:
    cases.append({
        'id': r['ID'],
        'name': r.get('用例名称',''),
        'priority': r.get('优先级',''),
        'type': r.get('终端覆盖类型',''),
        'steps': r.get('执行要求',''),
        'expect': r.get('预期结果',''),
        'tools': r.get('关联工具',''),
        'source': r.get('指引来源',''),
        'dim': r.get('维度',''),
        'design_status': r.get('design_status',''),
    })

# Group by priority
for pri in ['P0','P1','P2']:
    pri_cases = [c for c in cases if c['priority'] == pri]
    print(f'\n=== {pri} ({len(pri_cases)} cases) ===')
    for c in pri_cases:
        print(f"  {c['id']}  dim={c['dim']}  type={c['type']}  tools={c['tools'][:60]}")
        print(f"    expect: {c['expect'][:120]}")

# Save full list as JSON for the batch runner
with open(os.path.join(base, 'all_cases.json'), 'w', encoding='utf-8') as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)
print(f'\nTotal: {len(cases)} cases saved to all_cases.json')
