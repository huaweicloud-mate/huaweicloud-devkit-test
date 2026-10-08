import csv
rows=list(csv.reader(open('用例矩阵-设计级.csv',encoding='utf-8-sig')))
h=rows[0]
want = ['D1-65','D1-66','D1-67','D1-68','D1-69','D1-70','D2-27','D3-C13','D3-C14',
        'D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8',
        'D4-25','D4-26','D4-28','D4-29','D6-9','D8-9','D8-10','D9-10','D9-11','D9-12','D9-13']
cols = ['ID','维度','标题','优先级','前置条件','测试数据','操作步骤','预期结果','requiredEvidence','OS','agent','终端覆盖类型','展开规则']
idx = {c:h.index(c) for c in cols if c in h}
for r in rows[1:]:
    if r[0].strip() in want:
        print('#####', r[0])
        for c in cols:
            if c in idx:
                print(f'  {c}: {r[idx[c]]}')
        print()