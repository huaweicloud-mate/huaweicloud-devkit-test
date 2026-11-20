import csv, os
base = os.path.dirname(os.path.abspath(__file__))
rows = list(csv.DictReader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
lines = []
for r in rows:
    lines.append(f"{r['优先级']}|{r['ID']}|{r['维度']}|{r['标题']}|term={r['终端覆盖类型']}|os={r['OS']}|agent={r['agent']}|need={r['requiredEvidence']}|tool={r['关联工具']}")
rows2 = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
for r in rows2:
    lines.append(f"EXP|{r['优先级']}|{r['ID']}|src={r['源用例']}|{r['执行要点'][:60]}|agent={r['agent']}|os={r['OS']}|term={r['terminalType']}")
rows3 = list(csv.DictReader(open('使命-mission-001.csv', encoding='utf-8-sig')))
for r in rows3:
    lines.append(f"MISSION|{r['优先级']}|{r['ID']}|{r['标题'][:50]}")
open('_pack_list.txt','w',encoding='utf-8').write("\n".join(lines))
print("ok", len(lines))
