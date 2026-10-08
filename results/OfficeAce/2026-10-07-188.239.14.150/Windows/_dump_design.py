import csv, glob, json
# dump design cases id/title/prio/dimension
rows=list(csv.DictReader(open('用例矩阵-设计级.csv',encoding='utf-8-sig')))
out=[]
for r in rows:
    out.append({'ID':r['ID'],'标题':r.get('标题',''),'优先级':r.get('优先级',''),'维度':r.get('维度',''),'预期结果':r.get('预期结果','')[:200],'前置':r.get('前置条件','')[:80],'操作步骤':r.get('操作步骤','')[:300],'自动化建议':r.get('自动化建议','')[:120],'展开规则':r.get('展开规则','')[:120]})
with open('_design.json','w',encoding='utf-8') as f:
    json.dump(out,f,ensure_ascii=False,indent=1)
print('design', len(out))