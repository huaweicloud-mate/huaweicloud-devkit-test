#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""2026-09-15 补测 BLOCKED：消解 20 条假阻塞（D10 E01-E15 跑 harness/源码直调 + D1-58 01-05 跑 PTY 真机）。
仅改 执行状态/执行时间/evidencePath/blockedReason 四列，其余列原样保留。"""
import csv, os
from datetime import datetime, timezone, timedelta

D = os.path.dirname(os.path.abspath(__file__))
BJ = timezone(timedelta(hours=8))
TS = datetime.now(BJ).strftime('%Y%m%d%H%M%S')

def quote_row(cells):
    out = []
    for c in cells:
        s = str(c)
        if any(ch in s for ch in [',', '"', '\n', '\r']):
            s = '"' + s.replace('"', '""') + '"'
        out.append(s)
    return ','.join(out)

def ev(cid):
    p = f'evidence/{cid}/stdout.log'
    return p if os.path.exists(os.path.join(D, p)) else ''

expanded = {}
for cid in ['EXP-E06', 'EXP-E09', 'EXP-E15']:  # D10 HIT
    expanded[cid] = ('PASS', ev(cid), '')
for cid in ['EXP-E01', 'EXP-E02', 'EXP-E03', 'EXP-E04', 'EXP-E05',
            'EXP-E07', 'EXP-E10', 'EXP-E11', 'EXP-E12', 'EXP-E13', 'EXP-E14']:  # D10 MISS
    expanded[cid] = ('FAIL', ev(cid), '')
expanded['EXP-E08'] = ('BLOCKED', '', (
    '实测时间2026-09-15：EXP-E08「我的ECS启动失败了 帮我分析原因」为诊断类意图（期望路由 explain_error→只读诊断），'
    '确定性 harness（eval/harness/run-eval.mjs + 源码直调 huaweicloud_service_catalog）实测返回 N/A、不查服务目录，无法代理该诊断路由层；'
    '缺真实 Agent 会话评测 LLM harness（ITER-004+ 待建）才能判定「走 explain_error/只读诊断」路由；'
    '解除条件=LLM harness 建成后复测该诊断路由层。'))
for cid in ['EXP-D1-58-01', 'EXP-D1-58-02', 'EXP-D1-58-03', 'EXP-D1-58-04', 'EXP-D1-58-05']:  # D1-58 PTY PASS
    expanded[cid] = ('PASS', ev(cid), '')

path = os.path.join(D, '用例矩阵-展开级.csv')
with open(path, 'r', encoding='utf-8-sig', newline='') as f:
    raw = f.read()
lines = raw.split('\r\n')
header = lines[0].split(',')
i_id = header.index('ID')
i_status = header.index('执行状态')
i_time = header.index('执行时间')
i_ev = header.index('evidencePath')
i_br = header.index('blockedReason')

changed = 0
for idx in range(1, len(lines)):
    if not lines[idx].strip():
        continue
    cells = next(csv.reader([lines[idx]]))
    if len(cells) != len(header):
        continue
    cid = cells[i_id].strip().lstrip('\ufeff')
    got = expanded.get(cid)
    if not got:
        continue
    status, evp, br = got
    cells[i_status] = status
    cells[i_time] = TS
    cells[i_ev] = evp
    cells[i_br] = br
    lines[idx] = quote_row(cells)
    changed += 1

with open(path, 'w', encoding='utf-8-sig', newline='') as f:
    f.write('\r\n'.join(lines))

print(f'回填 {changed} 条（TS={TS}）')
with open(path, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        if r['ID'] in expanded:
            print(f"{r['ID']} -> {r['执行状态']} | ev={r['evidencePath'] or '-'} | br={(r['blockedReason'] or '-')[:36]}")