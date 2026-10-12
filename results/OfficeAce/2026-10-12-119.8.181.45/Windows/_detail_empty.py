# AI生成
import csv, json, os

csv.field_size_limit(262144)
base = os.path.dirname(os.path.abspath(__file__))

def get_cases(fname, filter_empty=True):
    path = os.path.join(base, fname)
    f = open(path, encoding='utf-8-sig')
    r = csv.DictReader(f)
    rows = list(r)
    f.close()
    keys = list(rows[0].keys())
    st_col = [k for k in keys if '执行状态' in k][0]
    id_col = [k for k in keys if k.strip() == 'ID' or k.strip() == 'id'][0]
    cases = []
    for row in rows:
        s = (row.get(st_col, '') or '').strip()
        if filter_empty and s:
            continue
        if not filter_empty and not s:
            continue
        case = {'id': row[id_col], 'raw': {}}
        for k, v in row.items():
            case['raw'][k] = v
        cases.append(case)
    return cases, keys

des_cases, des_keys = get_cases('用例矩阵-设计级.csv', True)
print("=== Design-level empty cases (full detail) ===")
print("Columns:", des_keys)
for c in des_cases:
    print(f"\n--- {c['id']} ---")
    for k, v in c['raw'].items():
        if v and v.strip():
            print(f"  {k}: {v[:200]}")

exp_cases, exp_keys = get_cases('用例矩阵-展开级.csv', True)
print("\n\n=== Expanded-level empty cases (full detail) ===")
print("Columns:", exp_keys)
for c in exp_cases:
    print(f"\n--- {c['id']} ---")
    for k, v in c['raw'].items():
        if v and v.strip():
            print(f"  {k}: {v[:200]}")
