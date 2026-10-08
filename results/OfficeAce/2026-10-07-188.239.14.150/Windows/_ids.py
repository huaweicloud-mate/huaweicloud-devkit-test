import csv
rows=list(csv.reader(open('用例矩阵-设计级.csv',encoding='utf-8-sig')))
ids=[r[0].strip() for r in rows[1:]]
print(len(ids))
print(ids)