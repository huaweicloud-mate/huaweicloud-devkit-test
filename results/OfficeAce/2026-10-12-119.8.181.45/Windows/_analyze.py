# AI生成
import csv, json, os, sys

csv.field_size_limit(262144)
base = os.path.dirname(os.path.abspath(__file__))

def analyze_csv(fname):
    path = os.path.join(base, fname)
    if not os.path.exists(path):
        return f"{fname}: NOT FOUND"
    f = open(path, encoding='utf-8-sig')
    r = csv.DictReader(f)
    rows = list(r)
    f.close()
    keys = list(rows[0].keys()) if rows else []
    st_cols = [k for k in keys if '执行状态' in k]
    prio_cols = [k for k in keys if '优先级' in k or 'priority' in k.lower()]
    st_col = st_cols[0] if st_cols else None
    prio_col = prio_cols[0] if prio_cols else None
    
    statuses = {}
    prio_status = {}
    for row in rows:
        s = (row.get(st_col, '') or '').strip() or '(empty)'
        statuses[s] = statuses.get(s, 0) + 1
        p = (row.get(prio_col, '') or '').strip() or '?'
        key = f"{p}/{s}"
        prio_status[key] = prio_status.get(key, 0) + 1
    
    lines = [f"=== {fname} ===", f"Total: {len(rows)}", f"Status col: {st_col}", f"Status dist: {dict(sorted(statuses.items()))}"]
    lines.append("Prio/Status breakdown:")
    for k in sorted(prio_status.keys()):
        lines.append(f"  {k}: {prio_status[k]}")
    return '\n'.join(lines)

print(analyze_csv('用例矩阵-设计级.csv'))
print()
print(analyze_csv('用例矩阵-展开级.csv'))
print()

# Check evidence dirs
ev_dir = os.path.join(base, 'evidence')
if os.path.exists(ev_dir):
    ev_dirs = [d for d in os.listdir(ev_dir) if os.path.isdir(os.path.join(ev_dir, d))]
    # Check which have stdout.log with content
    with_log = 0
    with_json_log = 0
    for d in ev_dirs:
        log_path = os.path.join(ev_dir, d, 'stdout.log')
        if os.path.exists(log_path) and os.path.getsize(log_path) > 0:
            with_log += 1
            try:
                with open(log_path, encoding='utf-8') as lf:
                    data = json.load(lf)
                if 'status' in data:
                    with_json_log += 1
            except:
                pass
    print(f"Evidence dirs: {len(ev_dirs)}, with non-empty stdout.log: {with_log}, with JSON status: {with_json_log}")

# Check for final_status, report, findings
for fn in ['_final_status.json', 'FINDINGS.md', '_run_summary.json']:
    p = os.path.join(base, fn)
    print(f"{fn}: {'EXISTS' if os.path.exists(p) else 'NOT FOUND'}")

reports = [f for f in os.listdir(base) if '测试报告' in f and f.endswith('.md')]
print(f"Test reports: {reports if reports else 'NONE'}")
