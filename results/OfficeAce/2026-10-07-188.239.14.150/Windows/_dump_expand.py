import csv, glob, json
rows=list(csv.DictReader(open('用例矩阵-展开级.csv',encoding='utf-8-sig')))
out=[]
for r in rows:
    out.append({'ID':r['ID'],'源用例':r.get('源用例',''),'优先级':r.get('优先级',''),'展开类型':r.get('展开类型',''),'枚举对象':r.get('枚举对象',''),'执行要点':r.get('执行要点','')[:300],'预期结果':r.get('预期结果','')[:200]})
with open('_expand.json','w',encoding='utf-8') as f:
    json.dump(out,f,ensure_ascii=False,indent=1)
print('expand', len(out))