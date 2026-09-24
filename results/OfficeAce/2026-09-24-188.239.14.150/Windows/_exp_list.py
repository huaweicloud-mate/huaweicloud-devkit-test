import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
import os
base = os.path.dirname(os.path.abspath(__file__))
erows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
for r in erows:
    print(f"{r['ID']:16s} P{r['优先级']:2s} {r['展开类型'][:16]:16s} 源={r['源用例']:10s} agent={r['agent']:12s} OS={r['OS']}")
print()
from collections import Counter
print('by agent:', dict(Counter(r['agent'] for r in erows)))
print('by 展开类型:', dict(Counter(r['展开类型'] for r in erows)))