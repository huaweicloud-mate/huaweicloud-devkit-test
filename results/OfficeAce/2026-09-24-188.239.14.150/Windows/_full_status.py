import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')
for fn in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv']:
    f=io.open(fn,encoding='utf-8-sig')
    r=csv.reader(f); rows=list(r); h=rows[0]
    print('==== '+fn+' (data rows %d) ===='% (len(rows)-1))
    for row in rows[1:]:
        print(row[0],'|',row[3] if fn.endswith('设计级.csv') else row[4],'|',repr(row[27] if fn.endswith('设计级.csv') else row[24]))