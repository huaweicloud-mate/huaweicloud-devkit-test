import csv
def dump(f, keys, outname):
    r=list(csv.reader(open(f,encoding='utf-8-sig')))
    hdr=r[0]
    lines=['==== '+f+' rows='+str(len(r)-1)+' ====']
    for row in r[1:]:
        d=dict(zip(hdr,row))
        lines.append(' || '.join(str(d.get(k,'')).strip() for k in keys))
    open(outname,'w',encoding='utf-8').write('\n'.join(lines))
dump('用例矩阵-设计级.csv',['ID','优先级','维度','标题'],'_full_design.txt')
dump('用例矩阵-展开级.csv',['ID','优先级','标题'],'_full_exp.txt')
print('done')