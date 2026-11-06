import csv
d = list(csv.DictReader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
print('TOTAL', len(d))
print('IDs:', ' '.join(x.get('ID','') for x in d))
print('----P0----')
for x in d:
    if x.get('优先级')=='P0':
        print(x.get('ID'), x.get('标题','')[:60])
print('----P1----')
for x in d:
    if x.get('优先级')=='P1':
        print(x.get('ID'), x.get('标题','')[:60])
print('----P2----')
for x in d:
    if x.get('优先级')=='P2':
        print(x.get('ID'), x.get('标题','')[:60])