# AI生成
import csv, json, os

csv.field_size_limit(262144)
base = os.path.dirname(os.path.abspath(__file__))

def get_empty(fname):
    path = os.path.join(base, fname)
    f = open(path, encoding='utf-8-sig')
    r = csv.DictReader(f)
    rows = list(r)
    f.close()
    keys = list(rows[0].keys())
    st_col = [k for k in keys if '执行状态' in k][0]
    prio_col = [k for k in keys if '优先级' in k or 'priority' in k.lower()][0]
    id_col = [k for k in keys if k.strip() == 'ID' or k.strip() == 'id'][0]
    empty = []
    for row in rows:
        s = (row.get(st_col, '') or '').strip()
        if not s:
            empty.append({
                'id': row[id_col],
                'prio': row[prio_col],
                'title': [v for k,v in row.items() if '标题' in k][0] if any('标题' in k for k in keys) else '',
            })
    return empty

des_empty = get_empty('用例矩阵-设计级.csv')
exp_empty = get_empty('用例矩阵-展开级.csv')

print("=== Design-level empty cases ===")
for c in des_empty:
    print(f"  {c['prio']} | {c['id']} | {c['title'][:60]}")
print(f"Total design empty: {len(des_empty)}")

print("\n=== Expanded-level empty cases ===")
for c in exp_empty:
    print(f"  {c['prio']} | {c['id']} | {c['title'][:60]}")
print(f"Total expanded empty: {len(exp_empty)}")

# Also list FAIL cases for reference
print("\n=== Design-level FAIL cases ===")
f = open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')
r = csv.DictReader(f)
rows = list(r)
f.close()
keys = list(rows[0].keys())
st_col = [k for k in keys if '执行状态' in k][0]
id_col = [k for k in keys if k.strip() == 'ID' or k.strip() == 'id'][0]
prio_col = [k for k in keys if '优先级' in k or 'priority' in k.lower()][0]
for row in rows:
    if (row.get(st_col,'') or '').strip() == 'FAIL':
        print(f"  {row[prio_col]} | {row[id_col]}")

print("\n=== Expanded-level FAIL cases ===")
f = open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')
r = csv.DictReader(f)
rows = list(r)
f.close()
keys = list(rows[0].keys())
st_col = [k for k in keys if '执行状态' in k][0]
id_col = [k for k in keys if k.strip() == 'ID' or k.strip() == 'id'][0]
for row in rows:
    if (row.get(st_col,'') or '').strip() == 'FAIL':
        print(f"  {row[id_col]}")
