import csv
e = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
for x in e:
    print(f"{x.get('ID')} | {x.get('优先级')} | {x.get('源用例','')} | {x.get('执行要点','')[:40]}")
print('TOTAL', len(e))