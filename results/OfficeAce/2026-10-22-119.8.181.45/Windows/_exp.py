import csv,io,sys
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
erows=list(csv.DictReader(open('用例矩阵-展开级.csv',encoding='utf-8-sig')))
from collections import Counter
print('PRI COUNTS:', dict(Counter(r['优先级'] for r in erows)))
for r in erows:
    print(r['ID'],'|',r.get('优先级',''),'|',r.get('源用例','')[:20],'|',r.get('agent','')[:25],'|',r.get('OS','')[:12],'|',(r.get('执行要点','') or '')[:60])