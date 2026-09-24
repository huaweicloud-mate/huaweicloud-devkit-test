import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')
f=io.open('用例矩阵-设计级.csv',encoding='utf-8-sig')
r=csv.reader(f); rows=list(r); h=rows[0]
for row in rows[1:]:
    print(row[0],'|',row[3],'|',row[16],'|',row[17],'|',repr(row[27]),'|',repr(row[29]))