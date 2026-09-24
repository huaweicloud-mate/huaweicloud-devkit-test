import os, json, csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

# 1) list every evidence dir and its stdout.log status
print('=== evidence dirs + stdout.log status ===')
dirstatus = {}
for cid in sorted(os.listdir(ev)):
    p = os.path.join(ev, cid)
    if not os.path.isdir(p):
        continue
    sp = os.path.join(p, 'stdout.log')
    st = 'NO_LOG'
    if os.path.isfile(sp):
        try:
            j = json.load(open(sp, encoding='utf-8-sig'))
            if isinstance(j, dict):
                st = j.get('status', j.get('passed', 'NOSTATUS'))
            else:
                st = 'NOTDICT'
        except Exception:
            st = 'PARSE_ERR'
    dirstatus[cid] = st
    print(f'  {cid:14s} {st}')

# 2) expanded CSV IDs
erows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
print()
print('=== expanded CSV IDs(', len(erows), ') ===')
for r in erows:
    print('  ', r['ID'], '|', r['优先级'], '|', r['展开类型'][:20], '| 源=', r['源用例'], '| agent=', r['agent'], '| OS=', r['OS'])