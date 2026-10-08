import csv, json
def clean(s):
    return (s or '').replace('\n',' ').strip()
rows=list(csv.DictReader(open('用例矩阵-设计级.csv',encoding='utf-8-sig')))
print("=== DESIGN %d ===" % len(rows))
for r in rows:
    print("[%s|%s|%s] %s | %s" % (r['ID'], r['优先级'], r['维度'], clean(r['标题']), clean(r['自动化建议'])))