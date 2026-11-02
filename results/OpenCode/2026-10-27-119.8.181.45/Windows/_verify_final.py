import csv
base = r'C:\Users\Administrator\devkit-test\testbot4-win-Opencode\huaweicloud-devkit-test\results\OpenCode\2026-10-27-119.8.181.45\Windows'
from collections import Counter

for fname in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv', '需求-设计-证据追踪表.csv']:
    fpath = base + '\\' + fname
    with open(fpath, encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    statuses = Counter()
    for r in rows:
        s = (r.get('执行状态') or r.get('execution_status') or '').strip()
        if not s:
            # Try to find the status column by looking for non-empty values in known status columns
            for k in r:
                if 'status' in k.lower() or '状态' in k:
                    v = (r[k] or '').strip()
                    if v:
                        s = v
                        break
        statuses[s] += 1
    print(f'{fname}: {len(rows)} rows, statuses={dict(statuses)}')
