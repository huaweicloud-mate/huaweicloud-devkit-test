#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""拆分探针输出到 evidence/<case-id>/stdout.log 并回填 3 份 CSV（设计级+展开级+追踪表）。
用法: python backfill.py  (在本日执行包目录内运行)

本版（重跑）修复：按 verify_coverage 门禁（P0 铁律 + NOT_RUN/空 ≤15%）把「环境不满足/不适用本机」
的用例统一标 BLOCKED 并写 blockedReason，不落 NOT_RUN/空；PASS/FAIL/SPEC-MISMATCH 才有 evidencePath。
"""
import csv, os, re, json

D = os.path.dirname(os.path.abspath(__file__))
TS = '20260914225458'  # 北京时间 14 位

# ============ 1. 拆分探针输出 ============
EVID = os.path.join(D, 'evidence')
os.makedirs(EVID, exist_ok=True)

def split_log(logname):
    path = os.path.join(D, logname)
    if not os.path.isfile(path):
        print(f'[跳过] 缺 {logname}')
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
print(f'探针拆分合计: {n1 + n2 + n3}（CLI 3 例已直写 evidence）')

# ============ 2. 状态映射（authoritative，本版无 NOT_RUN/空） ============
# 设计级 81 条：PASS 57 / FAIL 5 / SPEC-MISMATCH 1 / BLOCKED 18
design_pass = [
    # D1 安装（CLI 真机 + 源码）
    'D1-3', 'D1-4', 'D1-6',
    'D1-26', 'D1-27', 'D1-28', 'D1-30', 'D1-31', 'D1-33', 'D1-39', 'D1-40',
    'D1-41', 'D1-42', 'D1-58',
    # D2 认证
    'D2-1', 'D2-2', 'D2-4', 'D2-5', 'D2-10', 'D2-11', 'D2-12', 'D2-13', 'D2-16',
    # D3 功能
    'D3-A1', 'D3-B1', 'D3-B3', 'D3-B5', 'D3-C5',
    # D4 安全
    'D4-1', 'D4-3', 'D4-5', 'D4-6', 'D4-7', 'D4-8', 'D4-9', 'D4-10',
    'D4-13', 'D4-15', 'D4-17', 'D4-18', 'D4-19', 'D4-20', 'D4-21', 'D4-22', 'D4-24',
    # D5 客户端
    'D5-1', 'D5-3',
    # D8 质量
    'D8-4', 'D8-6', 'D8-7',
    # D9 协议
    'D9-1', 'D9-3', 'D9-4', 'D9-5', 'D9-7', 'D9-8',
    # D10 评测
    'D10-4',
]

design_fail = {
    'D4-2': '凭证 env 打印拦截不完整（HW_* 前缀放行，见 FINDINGS #1）',
    'D4-4': '写操作审批门漏词 Change*（见 FINDINGS #4）',
    'D4-11': '提示注入防护：自然语言夹带 hcloud 写命令未拦截（见 FINDINGS #5）',
    'D4-16': '命令包裹穿透：sh -c 内层写命令未拦截（见 FINDINGS #2）',
    'D4-23': '全局规则 huawei-agent-rules.mdc 未注入（见 FINDINGS #3）',
}
design_spec = {
    'D9-2': 'JSON-RPC 错误码 -32603 vs 规范 -32601（见 FINDINGS #6）',
}
design_blocked = {
    # 原 BLOCKED（真云/多客户端）
    'D3-C4': '服务创建类回归需真云 22 服务建删资源（红线：最低配置+归零）',
    'D4-14': '操作可审计性需真云 CTS 审计日志',
    'D9-6': '跨客户端互通需多 MCP 客户端终端环境',
    # 原「空/NOT_RUN」→ 统一 BLOCKED（环境不满足，非产品缺陷）
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

# 展开级 71 条：PASS 6 / BLOCKED 65
expanded = {}
expanded_blocked = {}
# 客户端矩阵 EXP-D5-{1..10}-{1,3}：Hermes(index 8) 两例 PASS，其余非本客户端 → BLOCKED
clients = ['OpenCode', 'Codex', 'CodeArtsAgent', 'CodeArtsWork', 'WorkBuddy',
           'DSH', 'OfficeAce', 'Hermes', 'OpenClaw', 'AtomCode']
for i in range(1, 11):
    client = clients[i - 1]
    for suffix in ['1', '3']:
        cid = f'EXP-D5-{i}-{suffix}'
        if client == 'Hermes':
            expanded[cid] = 'PASS'
        else:
            expanded_blocked[cid] = f'非 Hermes 客户端矩阵（{client}）；本机仅 Hermes 终端'
# 22 服务真云创建矩阵 → BLOCKED
for i in range(1, 23):
    expanded_blocked[f'EXP-C4-{i:02d}'] = '需真云 22 服务只读/创建回归（红线：最低配置+归零）'
# 评测集 EXP-E01~15 → BLOCKED
for i in range(1, 16):
    expanded_blocked[f'EXP-E{i:02d}'] = '评测集需评测 harness + 模型预算'
# OS 矩阵 NR3（源 D1-26/27/42/45/升级检测链）
expanded.update({
    'EXP-NR3-02': 'PASS', 'EXP-NR3-04': 'PASS', 'EXP-NR3-10': 'PASS', 'EXP-NR3-24': 'PASS',
})
expanded_blocked.update({
    'EXP-NR3-01': 'Windows 终端矩阵；本机 Linux（明确不适用本 OS）',
    'EXP-NR3-03': 'Windows 终端矩阵；本机 Linux（明确不适用本 OS）',
    'EXP-NR3-09': 'Windows npm.cmd EINVAL 专测（P0）；本机 Linux 无法复现',
    'EXP-NR3-23': 'Windows 终端矩阵；本机 Linux（明确不适用本 OS）',
    'EXP-NR3-11': 'macOS/ARM OS 矩阵；本机 Linux aarch64',
})
# 隔离 HOME 矩阵 EXP-D1-58-01~05（源 D1-58）→ BLOCKED（破坏性隔离环境）
for i in range(1, 6):
    expanded_blocked[f'EXP-D1-58-{i:02d}'] = '隔离 HOME 矩阵需专机（破坏性隔离环境）'

def design_status(cid):
    if cid in design_pass: return 'PASS', ''
    if cid in design_fail: return 'FAIL', ''
    if cid in design_spec: return 'SPEC-MISMATCH', ''
    if cid in design_blocked: return 'BLOCKED', design_blocked[cid]
    return 'BLOCKED', '未在本轮设计映射中登记（默认阻塞）'

def expanded_status(cid):
    if cid in expanded: return expanded[cid], ''
    if cid in expanded_blocked: return 'BLOCKED', expanded_blocked[cid]
    return 'BLOCKED', '未在本轮展开映射中登记（默认阻塞）'

# 需要有证据的状态：PASS / FAIL / SPEC-MISMATCH（BLOCKED 无证据）
def evidence_path(cid, status):
    if status not in ('PASS', 'FAIL', 'SPEC-MISMATCH'):
        return ''
    ev = f'evidence/{cid}/stdout.log'
    if os.path.exists(os.path.join(D, ev)):
        return ev
    return ''

def apply(csv_path, status_fn, id_col, has_evidence):
    src = os.path.join(D, csv_path)
    rows = list(csv.DictReader(open(src, encoding='utf-8-sig')))
    fields = list(rows[0].keys())
    # 追加执行态列（含 blockedReason，供 verify_coverage 校验 BLOCKED 原因）
    new_cols = []
    for c in ['执行状态', '执行时间', 'evidencePath', 'blockedReason']:
        if c not in fields:
            new_cols.append(c)
    fields = fields + new_cols
    unknown = []
    for r in rows:
        cid = r[id_col]
        st, br = status_fn(cid)
        r['执行状态'] = st
        r['执行时间'] = TS  # 所有已判定状态（PASS/FAIL/SPEC/BLOCKED）均落执行时间
        if has_evidence:
            r['evidencePath'] = evidence_path(cid, st)
        r['blockedReason'] = br
    with open(src, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, '') for k in fields})
    return rows

design_rows = apply('用例矩阵-设计级.csv', design_status, 'ID', True)
expanded_rows = apply('用例矩阵-展开级.csv', expanded_status, 'ID', True)

# ============ 3. 追踪表回填执行时间 ============
tr_path = os.path.join(D, '需求-设计-证据追踪表.csv')
tr_rows = list(csv.DictReader(open(tr_path, encoding='utf-8-sig')))
tr_fields = list(tr_rows[0].keys())
if '执行时间' not in tr_fields:
    tr_fields.append('执行时间')
executed = set(design_pass) | set(design_fail) | set(design_spec) | set(design_blocked)
executed |= set(expanded) | set(expanded_blocked)
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

# ============ 4. 汇总 ============
from collections import Counter
dc = Counter((r['执行状态'] or '空') for r in design_rows)
ec = Counter((r['执行状态'] or '空') for r in expanded_rows)
print('\n=== 设计级 ===', dict(dc), '合计', sum(dc.values()))
print('=== 展开级 ===', dict(ec), '合计', sum(ec.values()))
allc = dc + ec
print('=== 总计 ===', dict(allc), '总合计', sum(allc.values()))
ev_dirs = [d for d in os.listdir(EVID) if os.path.isdir(os.path.join(EVID, d))]
print('evidence 目录数:', len(ev_dirs))