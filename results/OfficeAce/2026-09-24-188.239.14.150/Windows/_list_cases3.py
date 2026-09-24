import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
print('===== DESIGN-LEVEL 88-102')
with open('用例矩阵-设计级.csv', encoding='utf-8-sig') as fh:
    rows = list(csv.DictReader(fh))
for i, r in enumerate(rows):
    if i < 87: continue
    cid = str(r.get('ID', '') or '').strip()
    title = str(r.get('标题', '') or '').strip()[:40]
    pri = str(r.get('优先级', '') or '').strip()
    status = str(r.get('执行状态', '') or '').strip()
    dur = str(r.get('执行时间', '') or '').strip()
    print(f'{i+1}|{cid}|{title}|[{pri}]|{status}|{dur}')

print('===== EXPANDED-LEVEL')
with open('用例矩阵-展开级.csv', encoding='utf-8-sig') as fh:
    rows = list(csv.DictReader(fh))
print('TOTAL', len(rows), 'COLS', list(rows[0].keys()) if rows else [])
from collections import Counter
cnt = Counter(); stat = Counter()
for r in rows:
    cnt[str(r.get('优先级', '')).replace('P','').strip()] += 1
    stat[str(r.get('执行状态', '') or '').strip()] += 1
print('PRI:', dict(cnt))
print('STATUS:', dict(stat))
for i, r in enumerate(rows):
    cid = str(r.get('展开用例ID', '') or r.get('ID', '') or '').strip()
    title = str(r.get('展开用例名称', '') or r.get('标题', '') or '').strip()[:50]
    pri = str(r.get('优先级', '') or '').strip()
    status = str(r.get('执行状态', '') or '').strip()
    dur = str(r.get('执行时间', '') or '').strip()
    print(f'{i+1}|{cid}|{title}|[{pri}]|{status}|{dur}')

print('===== TRACE')
with open('需求-设计-证据追踪表.csv', encoding='utf-8-sig') as fh:
    rows = list(csv.DictReader(fh))
print('TOTAL', len(rows), 'COLS', list(rows[0].keys()) if rows else [])
for i, r in enumerate(rows):
    print(f'{i+1}|' + '|'.join((str(r.get(k) or '').strip()[:28] for k in rows[0].keys())))