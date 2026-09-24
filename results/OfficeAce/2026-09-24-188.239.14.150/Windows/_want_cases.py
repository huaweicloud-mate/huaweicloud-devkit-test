import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')
want = set(['D4-16','D4-28','D4-2','D4-18','D4-19','D4-3','D4-5','D4-9','D4-15','D4-21','D4-22','D4-23','D8-7','D9-12','D9-13','D10-4','D10-3','D2-11','D2-4','D1-39','D1-40'])
f=io.open('用例矩阵-设计级.csv',encoding='utf-8-sig')
r=csv.reader(f); rows=list(r); h=rows[0]
iID=h.index('ID'); iT=h.index('标题'); iP=h.index('优先级'); iExp=h.index('预期结果'); iTool=h.index('关联工具')
for row in rows[1:]:
    if row[iID] in want:
        print('==== %s | %s | %s' % (row[iID], row[iP], row[iT]))
        print('  关联工具:', row[iTool])
        print('  预期:', row[iExp])