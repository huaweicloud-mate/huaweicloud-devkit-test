import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-27-119.8.181.45\Windows'

with open(base + '\\用例矩阵-设计级.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
lines = []
for row in rows:
    if (row.get('优先级') or '').strip() == 'P0':
        lines.append('%s | %s | %s' % (row.get('ID'), row.get('dimension', row.get('维度','')), (row.get('标题') or '')))
with open(base + '\\_p0_ids.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print(len(lines))