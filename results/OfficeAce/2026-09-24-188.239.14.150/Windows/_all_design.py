import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')
# design
f=io.open('用例矩阵-设计级.csv',encoding='utf-8-sig')
r=csv.reader(f); rows=list(r); h=rows[0]
iID=h.index('ID'); iT=h.index('标题'); iP=h.index('优先级'); iExp=h.index('预期结果'); iStep=h.index('操作步骤'); iTool=h.index('关联工具'); iSrc=h.index('指引来源')
print('==== DESIGN cases ====')
for row in rows[1:]:
    print('%s|%s|%s' % (row[iID], row[iP], row[iT]))
    print('  预期:', (row[iExp] or '')[:160])