# AI生成
import csv, json, os

base = os.path.dirname(os.path.abspath(__file__))

# Parse design-level
with open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    design_cases = list(reader)

# Parse expanded-level
with open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    expanded_cases = list(reader)

# Summary by priority
for label, cases in [('设计级', design_cases), ('展开级', expanded_cases)]:
    p0 = [c for c in cases if c.get('优先级') == 'P0']
    p1 = [c for c in cases if c.get('优先级') == 'P1']
    p2 = [c for c in cases if c.get('优先级') == 'P2']
    print(f"\n=== {label}: Total={len(cases)}, P0={len(p0)}, P1={len(p1)}, P2={len(p2)} ===")
    for prio, plist in [('P0', p0), ('P1', p1), ('P2', p2)]:
        print(f"\n--- {label} {prio} ---")
        for c in plist:
            title = c.get('标题', '')[:50]
            cid = c.get('ID', '')
            tools = c.get('关联工具', '')[:30]
            print(f"  {cid} | {title} | tools={tools}")

# Write JSON summary for programmatic use
summary = {
    'design': [{'ID': c['ID'], '优先级': c['优先级'], '标题': c['标题'], '关联工具': c.get('关联工具','')}
               for c in design_cases],
    'expanded': [{'ID': c['ID'], '优先级': c['优先级'], '标题': c['标题'], '关联工具': c.get('关联工具','')}
                 for c in expanded_cases],
}
with open(os.path.join(base, '_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
print("\n\nSummary written to _summary.json")