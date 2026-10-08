import csv, io, sys
for f, keys in [('用例矩阵-设计级.csv',['ID','优先级','维度','标题','OS','agent','terminal','展开规则']),
                ('用例矩阵-展开级.csv',['ID','优先级','维度','标题','OS','agent','terminal']),
                ('需求-设计-证据追踪表.csv',['ID','优先级','维度','标题','OS','agent','terminal'])]:
    r=list(csv.reader(open(f,encoding='utf-8-sig')))
    hdr=r[0]
    out=['==== '+f+' rows='+str(len(r)-1)+' ====']
    for row in r[1:]:
        d=dict(zip(hdr,row))
        out.append(' | '.join((str(d.get(k,''))[:40] if k in ('标题','展开规则') else str(d.get(k,''))) for k in keys))
    open(f.replace('.csv','.dump').replace('用例矩阵','_m').replace('需求-设计-证据追踪表','_tr')+'.txt','w',encoding='utf-8').write('\n'.join(out))
print('done')