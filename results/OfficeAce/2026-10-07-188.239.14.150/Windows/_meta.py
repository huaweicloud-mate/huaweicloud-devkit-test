import csv
for f in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv']:
    rows=list(csv.reader(open(f,encoding='utf-8-sig')))
    h=rows[0]
    print('====',f)
    for c in ['ID','优先级','OS','agent','终端覆盖类型','requiredEvidence','执行状态']:
        print(' ',c,'->',h.index(c) if c in h else 'NA')
    from collections import Counter
    pr=Counter(); ag=Counter(); osv=Counter(); st=Counter()
    for r in rows[1:]:
        pr[r[h.index('优先级')].strip()]+=1
        if 'agent' in h: ag[r[h.index('agent')].strip()]+=1
        if 'OS' in h: osv[r[h.index('OS')].strip()]+=1
        st[r[h.index('执行状态')].strip()]+=1
    print(' 优先级',dict(pr))
    print(' agent',dict(ag))
    print(' OS',dict(osv))
    print(' 执行状态',dict(st))