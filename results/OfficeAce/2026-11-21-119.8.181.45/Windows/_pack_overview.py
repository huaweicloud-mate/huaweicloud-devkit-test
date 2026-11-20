import csv, io, sys, os
base = os.path.dirname(os.path.abspath(__file__))
out = []
for f in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv','使命-mission-001.csv']:
    p = os.path.join(base, f)
    rows = list(csv.DictReader(open(p, encoding='utf-8-sig')))
    out.append(f"== {f} 共 {len(rows)} 行 ==")
    out.append("cols: " + ", ".join(rows[0].keys()))
with open(os.path.join(base, '_pack_overview.txt'), 'w', encoding='utf-8') as fh:
    fh.write("\n".join(out))
print("done")
