import csv, glob, json
out={}
for p in glob.glob('*.csv'):
    rows=list(csv.DictReader(open(p,encoding='utf-8-sig')))
    d={'rows':len(rows)}
    if rows:
        d['cols']=list(rows[0].keys())
        for k in rows[0].keys():
            if '优先级' in k or 'P' in k or 'riority' in k or 'level' in k.lower():
                from collections import Counter
                d['prio_'+k]=dict(Counter(r.get(k,'?') for r in rows))
    out[p]=d
with open('_probe.json','w',encoding='utf-8') as f:
    json.dump(out,f,ensure_ascii=False,indent=1)
print('OK', list(out.keys()))