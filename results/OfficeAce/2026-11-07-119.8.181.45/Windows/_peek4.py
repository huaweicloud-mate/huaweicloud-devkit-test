import csv
d = list(csv.DictReader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
print('DESIGN total', len(d))
for x in d:
    print(f"{x.get('ID')} | {x.get('优先级')} | {x.get('维度','')} | {x.get('标题','')[:50]}")