import sys, csv, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-13-119.8.181.45\Windows'
rows=list(csv.DictReader(open(base+'\\用例矩阵-设计级.csv', encoding='utf-8-sig')))
for r in rows:
    print(r['优先级'], r['ID'], r['维度'], r['标题'][:70], '| agent=', r.get('agent',''), '| OS=', r.get('OS',''), '| term=', r.get('terminal',''))
print()
rows2=list(csv.DictReader(open(base+'\\用例矩阵-展开级.csv', encoding='utf-8-sig')))
print('expanded cols:', list(rows2[0].keys()))
for r in rows2:
    print(r.get('优先级'), r.get('ID'), r.get('所属用例') or r.get('设计级ID'), str(r.get('标题'))[:60])
