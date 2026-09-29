# AI生成
import csv, json, os

base = os.path.dirname(os.path.abspath(__file__))
f = open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')
r = csv.DictReader(f)
rows = list(r)
f.close()

p0 = [x for x in rows if x.get('优先级') == 'P0']
out = []
for c in p0:
    out.append('=' * 80)
    out.append(f"ID: {c['ID']}")
    out.append(f"Title: {c['标题']}")
    out.append(f"Steps: {c.get('操作步骤', '')[:300]}")
    out.append(f"Expected: {c.get('预期结果', '')[:300]}")
    out.append(f"Tool: {c.get('关联工具', '')[:120]}")
    out.append(f"Guide: {c.get('指引来源', '')[:120]}")
    out.append(f"Agent: {c.get('agent', '')[:100]}")
    out.append(f"OS: {c.get('OS', '')[:100]}")
    out.append(f"CovType: {c.get('终端覆盖类型', '')}")
    out.append('')

with open(os.path.join(base, '_p0_details.txt'), 'w', encoding='utf-8') as w:
    w.write('\n'.join(out))
print(f'Wrote {len(p0)} P0 cases to _p0_details.txt')