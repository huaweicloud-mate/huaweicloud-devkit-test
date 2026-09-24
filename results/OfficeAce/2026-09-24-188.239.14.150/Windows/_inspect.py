import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')
for fn in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv','需求-设计-证据追踪表.csv']:
    f=io.open(fn,encoding='utf-8-sig')
    r=csv.reader(f)
    rows=list(r)
    h=rows[0]
    print('==== '+fn+' ====')
    print('header len',len(h))
    print(h)
    print('data rows',len(rows)-1)
    # find key cols
    keys=['ID','优先级','执行状态','agent','OS','展开类型','源用例','designCaseId']
    cols={}
    for k in keys:
        if k in h:
            cols[k]=h.index(k)
    print('cols',cols)