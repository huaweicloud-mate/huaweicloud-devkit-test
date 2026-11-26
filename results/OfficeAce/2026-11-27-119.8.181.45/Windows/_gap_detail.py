import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
rows = list(csv.DictReader(open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-27-119.8.181.45\Windows\用例矩阵-设计级.csv', encoding='utf-8-sig')))
targets = ['D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8','D9-3','D9-4','D9-5','D9-6','D9-7','D9-8']
for r in rows:
    if r['ID'] in targets:
        print(r['ID'], '|', r['优先级'], '|', r['标题'], '|', (r['操作步骤'] or '')[:100].replace('\n',' '))
