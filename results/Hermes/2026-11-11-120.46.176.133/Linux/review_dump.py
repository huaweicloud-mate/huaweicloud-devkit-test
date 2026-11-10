# -*- coding: utf-8 -*-
"""Dump per-case review table for manual verification (no writes)."""
import os, re, csv, json, sys

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
import importlib.util
spec = importlib.util.spec_from_file_location("stage", os.path.join(BASE, "stage_1111.py"))
# avoid executing stage body: parse pieces manually instead
src = open(os.path.join(BASE, "stage_1111.py"), encoding="utf-8").read()

P = os.path.join(BASE, 'evidence', '_probes')
EV = os.path.join(BASE, 'evidence')
RC = os.path.join(EV, 'realcloud-probe')

rd = lambda pp: open(pp, encoding='utf-8', errors='replace').read() if os.path.isfile(pp) else ''
ns = {'re': re, 'os': os, 'json': json, 'rd': rd, 'P': P}
# extract MAP building section
blk = src[src.index("MAP = {}"):src.index("# logfile -> probe 源文件名")]
exec(blk, ns)
MAP = ns['MAP']
WHY = ns.get('WHY', {})
exec(src[src.index('SPEC = {'):src.index('# --- 证据来源映射')], ns)
SPEC, BLOCKED, NOT_RUN = ns['SPEC'], ns['BLOCKED'], ns['NOT_RUN']
exec(src[src.index("FAIL_PAT = re.compile"):src.index("def status_of")], ns)
judge = ns['judge']
exec(src[src.index("def get_section"):src.index("FAIL_PAT = re.compile")], ns)
get_section = ns['get_section']
rd = lambda p: open(p, encoding='utf-8', errors='replace').read() if os.path.isfile(p) else ''

meta = {}
for fn in ('用例矩阵-设计级.csv', '用例矩阵-展开级.csv'):
    for r in csv.DictReader(open(os.path.join(BASE, fn), encoding='utf-8-sig')):
        meta[r['ID'].strip()] = (r.get('标题', ''), r.get('预期结果', ''), r.get('优先级', ''))

rc_txt = rd(os.path.join(RC, 'stdout.txt'))
eval_txt = rd(os.path.join(P, 'eval-harness.log'))
SELF = ['D3-C1', 'D3-C2', 'D3-C3', 'D3-C6', 'D3-C7', 'D4-13', 'D4-23', 'D4-24']
RC_CASES = ['D2-1', 'D3-C4', 'D4-14', 'D4-18', 'D4-19', 'D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]

out = []
rows = []
for cid, (logfile, sec) in sorted(MAP.items()):
    if cid.startswith('EXP-E') and logfile == 'eval-harness.log':
        body = '\n'.join([l for l in eval_txt.splitlines() if l.startswith(cid + ' |')])
    else:
        body, _ok = get_section(logfile, sec or cid)
    st, why = judge(body)
    rows.append((cid, st, logfile, body))
for cid in RC_CASES:
    st, why = judge(rc_txt)
    rows.append((cid, st, 'realcloud-probe', rc_txt))
for cid in SELF:
    txt = rd(os.path.join(EV, cid, 'stdout.txt'))
    st, why = judge(txt) if txt.strip() else ('BLOCKED', 'no output')
    rows.append((cid, st, 'self', txt))

with open('/tmp/review_1111.txt', 'w', encoding='utf-8') as f:
    for cid, st, src_name, body in sorted(rows):
        t, exp, prio = meta.get(cid, ('', '', ''))
        f.write('\n######## %s [%s] %s | %s\n' % (cid, st, prio, src_name))
        f.write('TITLE: %s\nEXPECT: %s\n' % (t[:160], exp[:220]))
        lines = [l for l in body.splitlines() if not l.startswith('=====')]
        f.write('OUT(%d lines):\n' % len(lines))
        for l in lines[:14]:
            f.write('  ' + l[:220] + '\n')
print('rows', len(rows), 'file /tmp/review_1111.txt')

from collections import Counter
print(Counter(r[1] for r in rows))