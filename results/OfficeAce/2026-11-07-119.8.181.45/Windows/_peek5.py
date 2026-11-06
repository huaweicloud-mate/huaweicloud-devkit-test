import csv
e = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
print('EXPANDED total', len(e))
for x in e:
    print(f"{x.get('ID')} | {x.get('优先级')} | {x.get('源用例','')} | agent={x.get('agent','')} | OS={x.get('OS','')}")