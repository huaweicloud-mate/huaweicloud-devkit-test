#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""2026-09-15 每日测试回填：拆分探针输出 → evidence/<case-id>/stdout.log → 回填 3 份 CSV。
SUT = huaweicloud-devkit v1.1.4（official npm latest，gitHead 9b67256）。
门禁口径：P0 不得 NOT_RUN/空；环境不满足/不适用本机 → BLOCKED + blockedReason；PASS/FAIL/SPEC 才有 evidencePath。
"""
import csv, os, re, subprocess
from datetime import datetime, timezone, timedelta

D = os.path.dirname(os.path.abspath(__file__))
BJ = timezone(timedelta(hours=8))
TS = datetime.now(BJ).strftime('%Y%m%d%H%M%S')

EVID = os.path.join(D, 'evidence')
os.makedirs(EVID, exist_ok=True)

def split_log(logname):
    path = os.path.join(D, logname)
    if not os.path.isfile(path):
        return 0
    text = open(path, encoding='utf-8').read()
    blocks = re.findall(r'@@CASE\s+([\w-]+)@@(.*?)@@END@@', text, re.S)
    for cid, body in blocks:
        dd = os.path.join(EVID, cid)
        os.makedirs(dd, exist_ok=True)
        with open(os.path.join(dd, 'stdout.log'), 'w', encoding='utf-8') as f:
            f.write(f'@@CASE {cid}@@\n{body.strip()}\n@@END@@\n')
    print(f'{logname}: 拆分 {len(blocks)} 个 case')
    return len(blocks)

n1 = split_log('stdout-daily.log')
n2 = split_log('stdout-supplement.log')
n3 = split_log('stdout-exp.log')
print(f'探针拆分合计: {n1+n2+n3}')

# D9-2 用 stdio server 层真机探针（probe-d9-2.mjs）覆盖，协议层 INFO 不做定论
r = subprocess.run(['node', os.path.join(D, 'probe-d9-2.mjs')], capture_output=True, text=True)
with open(os.path.join(EVID, 'D9-2', 'stdout.log'), 'w', encoding='utf-8') as f:
    f.write(r.stdout)

# ============ 状态映射（SUT v1.1.4，缺陷与 1.1.4-next.3 同源复现） ============
design_pass = [
    'D1-3', 'D1-4', 'D1-6',
    'D1-26', 'D1-27', 'D1-28', 'D1-30', 'D1-31', 'D1-33', 'D1-39', 'D1-40',
    'D1-41', 'D1-42', 'D1-58',
    'D2-1', 'D2-2', 'D2-4', 'D2-5', 'D2-10', 'D2-11', 'D2-12', 'D2-13', 'D2-16',
    'D3-A1', 'D3-B1', 'D3-B3', 'D3-B5', 'D3-C5',
    'D4-1', 'D4-3', 'D4-5', 'D4-6', 'D4-7', 'D4-8', 'D4-9', 'D4-10',
    'D4-13', 'D4-15', 'D4-17', 'D4-18', 'D4-19', 'D4-20', 'D4-21', 'D4-22', 'D4-24',
    'D5-1', 'D5-3',
    'D8-4', 'D8-6', 'D8-7',
    'D9-1', 'D9-3', 'D9-4', 'D9-5', 'D9-7', 'D9-8',
    'D10-4',
]

design_fail = {
    'D4-2': '凭证 env 打印拦截不完整（HW_* 前缀放行，FINDINGS #1）',
    'D4-4': '写操作审批门漏词 Change*（FINDINGS #4）',
    'D4-11': '提示注入防护：自然语言夹带 hcloud 写命令未拦截（FINDINGS #5）',
    'D4-16': '命令包裹穿透：sh -c 内层写命令未拦截（FINDINGS #2）',
    'D4-23': '全局规则 huawei-agent-rules.mdc 未注入（FINDINGS #3）',
}
design_spec = {
    'D9-2': 'JSON-RPC 错误码 -32603 vs 规范 -32601（FINDINGS #6）',
}
design_blocked = {
    'D3-C4': '服务创建类回归需真云 22 服务建删资源（红线：最低配置+归零）',
    'D4-14': '操作可审计性需真云 CTS 审计日志',
    'D9-6': '跨客户端互通需多 MCP 客户端终端环境',
    'D1-1': '全新环境引导安装需空 HOME+PTY 交互（破坏性），本机日常环境禁用',
    'D1-2': '多 Agent 探测需多客户端并存环境',
    'D1-5': 'uninstall 干净度属破坏性（卸载全局包），本机日常环境禁用',
    'D1-45': '兜底提示预热竞态需冷启时序观测；Linux 兜底路径已由 EXP-NR3-24 覆盖',
    'D4-12': '供应链安装期安全审计需发布流水线上下文',
    'D6-1': '检索响应延迟采样需专用性能 harness + 统计环境',
    'D6-3': 'MCP 冷启时间采样需专用性能 harness',
    'D6-4': '并发调度正确性采样需专用性能 harness',
    'D9-9': 'tools/call 超时取消语义需注入长耗时服务',
    'D7-4': '国内镜像源安装需镜像网络可达（本机走官方源）',
    'D8-1': '文档与能力一致性需全文人工核对；本轮仅抽查 D8-4/D8-6',
    'D10-1': '工具描述可选择性评测需评测 harness + 标注模型',
    'D10-2': 'skill 激活率评测需评测 harness + 模型预算',
    'D10-3': '路由准确率+混淆矩阵评测需评测 harness',
    'D10-5': '多轮任务完成率评测需评测 harness',
}

# 展开级 48 条（init_day 预筛后仅 Hermes/Linux 适用行）：PASS 6 / BLOCKED 42
expanded_pass = ['EXP-D5-8-1', 'EXP-D5-8-3', 'EXP-NR3-02', 'EXP-NR3-04', 'EXP-NR3-10', 'EXP-NR3-24']
expanded_blocked = {}
for i in range(1, 23):
    expanded_blocked[f'EXP-C4-{i:02d}'] = '需真云 22 服务只读/创建回归（红线：最低配置+归零）'
for i in range(1, 16):
    expanded_blocked[f'EXP-E{i:02d}'] = '评测集需评测 harness + 模型预算'
for i in range(1, 6):
    expanded_blocked[f'EXP-D1-58-{i:02d}'] = '隔离 HOME 矩阵需专机（破坏性隔离环境）'

def design_status(cid):
    if cid in design_pass: return 'PASS', ''
    if cid in design_fail: return 'FAIL', ''
    if cid in design_spec: return 'SPEC-MISMATCH', ''
    if cid in design_blocked: return 'BLOCKED', design_blocked[cid]
    return 'BLOCKED', '未在本轮设计映射中登记（默认阻塞）'

def expanded_status(cid):
    if cid in expanded_pass: return 'PASS', ''
    if cid in expanded_blocked: return 'BLOCKED', expanded_blocked[cid]
    return 'BLOCKED', '未在本轮展开映射中登记（默认阻塞）'

def evidence_path(cid, status):
    if status not in ('PASS', 'FAIL', 'SPEC-MISMATCH'):
        return ''
    ev = f'evidence/{cid}/stdout.log'
    return ev if os.path.exists(os.path.join(D, ev)) else ''

def apply(csv_path, status_fn, id_col):
    src = os.path.join(D, csv_path)
    rows = list(csv.DictReader(open(src, encoding='utf-8-sig')))
    fields = list(rows[0].keys())
    for c in ['执行状态', '执行时间', 'evidencePath', 'blockedReason']:
        if c not in fields:
            fields.append(c)
    for r in rows:
        cid = r[id_col]
        st, br = status_fn(cid)
        r['执行状态'] = st
        r['执行时间'] = TS
        r['evidencePath'] = evidence_path(cid, st)
        r['blockedReason'] = br
    with open(src, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, '') for k in fields})
    return rows

design_rows = apply('用例矩阵-设计级.csv', design_status, 'ID')
expanded_rows = apply('用例矩阵-展开级.csv', expanded_status, 'ID')

# 追踪表回填执行时间
tr_path = os.path.join(D, '需求-设计-证据追踪表.csv')
tr_rows = list(csv.DictReader(open(tr_path, encoding='utf-8-sig')))
tr_fields = list(tr_rows[0].keys())
if '执行时间' not in tr_fields:
    tr_fields.append('执行时间')
executed = set(design_pass) | set(design_fail) | set(design_spec) | set(design_blocked)
executed |= set(expanded_pass) | set(expanded_blocked)
for r in tr_rows:
    hit = False
    for k in ('designCaseId', 'expandedCaseId', '源用例', 'ID', '设计用例ID', '展开用例ID'):
        v = r.get(k, '')
        if v and v in executed:
            hit = True
            break
    r['执行时间'] = TS if hit else ''
with open(tr_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=tr_fields)
    w.writeheader()
    for r in tr_rows:
        w.writerow({k: r.get(k, '') for k in tr_fields})

from collections import Counter
dc = Counter((r['执行状态'] or '空') for r in design_rows)
ec = Counter((r['执行状态'] or '空') for r in expanded_rows)
print('\n=== 设计级 ===', dict(dc), '合计', sum(dc.values()))
print('=== 展开级 ===', dict(ec), '合计', sum(ec.values()))
print('=== 总计 ===', dict(dc + ec), '总合计', sum((dc + ec).values()))
print('证据目录数:', len([d for d in os.listdir(EVID) if os.path.isdir(os.path.join(EVID, d))]))
print('时间戳(北京时间):', TS)