import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-14-119.8.181.45\Windows"
rows = list(csv.reader(open(base + r"\用例矩阵-设计级.csv", encoding='utf-8-sig')))
out = []
for r in rows[1:]:
    out.append('%s|%s|%s|%s' % (r[0], r[1], r[3], r[7][:80].replace('\n', ' ')))
open(base + r"\_plan.txt", 'w', encoding='utf-8').write('\n'.join(out))
print('design cases:', len(out))
rows2 = list(csv.reader(open(base + r"\用例矩阵-展开级.csv", encoding='utf-8-sig')))
out2 = ['%s|%s|%s' % (r[0], r[3], r[7][:60].replace('\n', ' ')) for r in rows2[1:]]
open(base + r"\_plan_exp.txt", 'w', encoding='utf-8').write('\n'.join(out2))
print('expanded cases:', len(out2))
