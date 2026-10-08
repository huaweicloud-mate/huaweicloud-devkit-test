import csv, json
def clean(s):
    return (s or '').replace('\n',' ').strip()
rows=list(csv.DictReader(open('用例矩阵-展开级.csv',encoding='utf-8-sig')))
print("=== EXPAND %d ===" % len(rows))
for r in rows:
    print("[%s|%s|%s] 源=%s | %s | 要点=%s" % (r['ID'], r['优先级'], r['展开类型'], r['源用例'], clean(r['枚举对象']), clean(r['执行要点'])[:120]))