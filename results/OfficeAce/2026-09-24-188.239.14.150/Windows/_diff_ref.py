import os, sys, csv, json
sys.stdout.reconfigure(encoding='utf-8')

base_cur = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-24-188.239.14.150\Windows'
base_ref = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-22-188.239.14.150\Windows'

ev_cur = sorted(os.listdir(os.path.join(base_cur, 'evidence')))
ev_ref = sorted(os.listdir(os.path.join(base_ref, 'evidence')))

# read reference CSV mapping id -> (status, time, evidencePath, blockedReason)
def read_map(csvpath):
    m = {}
    rows = list(csv.DictReader(open(csvpath, encoding='utf-8-sig')))
    for r in rows:
        m[r['ID'].strip()] = r
    return m

ref_d = read_map(os.path.join(base_ref, '用例矩阵-设计级.csv'))
ref_e = read_map(os.path.join(base_ref, '用例矩阵-展开级.csv'))

print('=== reference evidence dirs that are in design CSV but missing in current evidence ===')
for cid, r in sorted(ref_d.items()):
    st = (r.get('执行状态') or '').strip()
    if st in ('', 'NOT_RUN', 'BLOCKED'):
        continue
    if cid in ev_cur:
        continue
    print(' D', cid, '| ref_status=', st, '| ref_ev=', r.get('evidencePath'))

print()
print('=== reference evidence dirs in expanded CSV but missing in current ===')
for cid, r in sorted(ref_e.items()):
    st = (r.get('执行状态') or '').strip()
    if st in ('', 'NOT_RUN', 'BLOCKED'):
        continue
    if cid in ev_cur:
        continue
    print(' E', cid, '| ref_status=', st, '| ref_ev=', r.get('evidencePath'))