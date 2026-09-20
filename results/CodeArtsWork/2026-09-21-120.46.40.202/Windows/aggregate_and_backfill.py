# -*- coding: utf-8 -*-
"""聚合探针结果 -> 逐用例证据 + 回填 CSV + 生成报告。"""
import json, os, csv, datetime
from collections import defaultdict

EVID = 'evidence'
NOW = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
REPORT_TIME = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')

# 1. 加载全部探针结果
probes = {
    'P0': 'evidence/probe-p0-out.json',
    'P1': 'evidence/probe-p1-out.json',
    'P2': 'evidence/probe-p2-out.json',
    'EXP': 'evidence/probe-expanded-out.json',
}
all_cases = {}  # id -> {pass, fails, checks, probe}
for prio, path in probes.items():
    d = json.load(open(path, encoding='utf-8'))
    cases = defaultdict(lambda: {'pass': True, 'fails': [], 'checks': [], 'probe': prio})
    for r in d['results']:
        cases[r['id']]['checks'].append(r)
        if not r['pass']:
            cases[r['id']]['pass'] = False
            cases[r['id']]['fails'].append(r['name'])
    for cid, c in cases.items():
        all_cases[cid] = c

# 2. 写逐用例证据 stdout.log
for cid, c in all_cases.items():
    odir = os.path.join(EVID, cid)
    os.makedirs(odir, exist_ok=True)
    status = 'PASS' if c['pass'] else 'FAIL'
    lines = [
        f'{c["probe"]} probe evidence for {cid}',
        f'Probe: probe-{c["probe"].lower()}.mjs',
        f'Time: 2026-09-21 05:10 (UTC+8)',
        f'Overall: {status}',
        '',
    ]
    for chk in c['checks']:
        lines.append(f'[{ "PASS" if chk["pass"] else "FAIL" }] {chk["name"]}')
        lines.append(f'  actual: {chk["actual"][:600]}')
        lines.append('')
    with open(os.path.join(odir, 'stdout.log'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

print(f'Wrote evidence for {len(all_cases)} cases')

# 3. 回填设计级 CSV
design_path = '用例矩阵-设计级.csv'
with open(design_path, encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())

design_stats = {'PASS': 0, 'FAIL': 0, 'BLOCKED': 0, 'NOT_RUN': 0}
for r in rows:
    cid = r.get('ID', '')
    if cid in all_cases:
        c = all_cases[cid]
        r['执行状态'] = 'PASS' if c['pass'] else 'FAIL'
        r['执行时间'] = NOW
        r['evidencePath'] = f'evidence/{cid}/stdout.log'
        if not c['pass']:
            r['blockedReason'] = ''
        design_stats[r['执行状态']] += 1
    else:
        r['执行状态'] = 'NOT_RUN'
        r['执行时间'] = NOW
        r['evidencePath'] = ''
        r['blockedReason'] = '探针未覆盖此用例ID'
        design_stats['NOT_RUN'] += 1

with open(design_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    for r in rows:
        w.writerow(r)
print(f'设计级回填: {design_stats}')

# 4. 回填展开级 CSV
exp_path = '用例矩阵-展开级.csv'
with open(exp_path, encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())

exp_stats = {'PASS': 0, 'FAIL': 0, 'BLOCKED': 0, 'NOT_RUN': 0}
for r in rows:
    cid = r.get('expandedCaseId', '')
    if cid in all_cases:
        c = all_cases[cid]
        r['执行状态'] = 'PASS' if c['pass'] else 'FAIL'
        r['执行时间'] = NOW
        r['evidencePath'] = f'evidence/{cid}/stdout.log'
        exp_stats[r['执行状态']] += 1
    else:
        r['执行状态'] = 'NOT_RUN'
        r['执行时间'] = NOW
        r['evidencePath'] = ''
        r['blockedReason'] = '探针未覆盖此展开级用例ID'
        exp_stats['NOT_RUN'] += 1

with open(exp_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    for r in rows:
        w.writerow(r)
print(f'展开级回填: {exp_stats}')

# 5. 回填追踪表
trace_path = '需求-设计-证据追踪表.csv'
with open(trace_path, encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
for r in rows:
    r['执行时间'] = NOW
with open(trace_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    for r in rows:
        w.writerow(r)
print(f'追踪表回填: {len(rows)} 行')

# 6. 输出 FAIL 清单
fails = [(cid, c) for cid, c in all_cases.items() if not c['pass']]
print(f'\nFAIL 用例: {len(fails)}')
for cid, c in fails:
    print(f'  {cid} ({c["probe"]}): {c["fails"]}')

# 7. 保存聚合结果供报告生成
with open('evidence/aggregated-results.json', 'w', encoding='utf-8') as f:
    json.dump({cid: {'pass': c['pass'], 'fails': c['fails'], 'probe': c['probe']}
               for cid, c in all_cases.items()}, f, ensure_ascii=False, indent=2)
print('\n聚合结果已保存 evidence/aggregated-results.json')
