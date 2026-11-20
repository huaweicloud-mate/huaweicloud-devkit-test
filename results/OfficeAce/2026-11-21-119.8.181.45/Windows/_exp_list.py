import csv
from collections import Counter
rows2 = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
out = []
out.append(f"展开级: {len(rows2)} " + str(dict(Counter(r['优先级'] for r in rows2))))
out.append("源分布: " + str(dict(Counter(r['源用例'] for r in rows2))))
for r in rows2:
    out.append(f"{r['ID']} | P={r['优先级']} | {r['执行要点'][:150]}")
open('_exp_list.txt','w',encoding='utf-8').write("\n".join(out))
print("ok")
