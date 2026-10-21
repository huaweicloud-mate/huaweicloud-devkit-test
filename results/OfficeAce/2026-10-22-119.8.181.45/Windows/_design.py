import csv,io,sys
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
rows=list(csv.DictReader(open('用例矩阵-设计级.csv',encoding='utf-8-sig')))
for r in rows:
    if r.get('优先级')=='P0':
        print(r['ID'],'|',r.get('终端覆盖类型',''),'|',(r.get('标题','')))
print()
print('=== expanded P0 ===')
erows=list(csv.DictReader(open('用例矩阵-展开级.csv',encoding='utf-8-sig')))
for r in erows:
    if r.get('优先级')=='P0':
        print(r['ID'],'|',r.get('agent','')[:30],'|',r.get('OS','')[:20],'|',(r.get('源用例','') or r.get('执行要点',''))[:50])