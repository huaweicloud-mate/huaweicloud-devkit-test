# AI生成
import json, csv, os

csv.field_size_limit(262144)
base = os.path.dirname(os.path.abspath(__file__))
ev_base = os.path.join(base, 'evidence')

def get_fail_cases(fname):
    path = os.path.join(base, fname)
    f = open(path, encoding='utf-8-sig')
    r = csv.DictReader(f)
    rows = list(r)
    f.close()
    keys = list(rows[0].keys())
    st_col = [k for k in keys if '执行状态' in k][0]
    id_col = [k for k in keys if k.strip() == 'ID' or k.strip() == 'id'][0]
    prio_col = [k for k in keys if '优先级' in k or 'priority' in k.lower()][0]
    dim_col = [k for k in keys if '维度' in k][0] if any('维度' in k for k in keys) else None
    title_col = [k for k in keys if '标题' in k][0] if any('标题' in k for k in keys) else None
    fails = []
    for row in rows:
        if (row.get(st_col, '') or '').strip() == 'FAIL':
            cid = row[id_col]
            log_path = os.path.join(ev_base, cid, 'stdout.log')
            why = ''
            if os.path.exists(log_path):
                try:
                    data = json.load(open(log_path, encoding='utf-8'))
                    why = data.get('why', '') or str(data)[:300]
                except:
                    why = open(log_path, encoding='utf-8').read()[:300]
            fails.append({
                'id': cid, 'prio': row[prio_col], 'dim': row.get(dim_col,'') if dim_col else '',
                'title': row.get(title_col,'') if title_col else '', 'why': why
            })
    return fails

des_fails = get_fail_cases('用例矩阵-设计级.csv')
exp_fails = get_fail_cases('用例矩阵-展开级.csv')

print("=== Design FAIL cases ===")
for f in des_fails:
    print(f"\n[{f['prio']}] {f['id']} ({f['dim']}) {f['title']}")
    print(f"  why: {f['why'][:300]}")

print("\n=== Expanded FAIL cases ===")
for f in exp_fails:
    print(f"\n[{f['prio']}] {f['id']}")
    print(f"  why: {f['why'][:300]}")
