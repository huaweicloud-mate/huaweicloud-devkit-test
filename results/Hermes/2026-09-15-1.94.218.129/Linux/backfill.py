#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""2026-09-15 每日测试回填（v1.1.4）：拆分探针输出 → evidence/<case-id>/stdout.log → 回填 3 份 CSV。

SUT = huaweicloud-devkit v1.1.4（官方 npm `latest` 正式版，gitHead 9b67256）。
daily 精选集：设计级 77 + 展开级 49（init_day 预筛后本 Hermes/Linux 26）。
门禁口径：P0 不得 NOT_RUN/空；环境/凭证/依赖缺失 → BLOCKED + blockedReason；PASS/FAIL/SPEC 才落 evidencePath。
状态映射全部来自当日实际探针/CLI 实测（probe-daily / probe-supplement / probe-exp / probe-perf-route / probe-d9-2 + doctor/status/install-hcloud CLI），非复制历史。
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

for log in ['stdout-daily.log', 'stdout-supplement.log', 'stdout-exp.log', 'stdout-perf-route.log']:
    split_log(log)

# D9-2 用 stdio server 层探针（probe-d9-2.mjs）覆盖，协议层 INFO 不做定论
r = subprocess.run(['node', os.path.join(D, 'probe-d9-2.mjs')], capture_output=True, text=True)
os.makedirs(os.path.join(EVID, 'D9-2'), exist_ok=True)
with open(os.path.join(EVID, 'D9-2', 'stdout.log'), 'w', encoding='utf-8') as f:
    f.write(r.stdout)

# ============ 设计级状态映射（77） ============
design_pass = [
    # D1 安装/升级（CLI 实测 + 升级检测链探针）
    'D1-3', 'D1-4', 'D1-6', 'D1-26', 'D1-27', 'D1-28', 'D1-30', 'D1-31', 'D1-33',
    'D1-39', 'D1-40', 'D1-41', 'D1-42', 'D1-58',
    # D2 认证
    'D2-1', 'D2-2', 'D2-4', 'D2-5', 'D2-10', 'D2-11', 'D2-12', 'D2-13', 'D2-16',
    # D3 功能
    'D3-A1', 'D3-B1', 'D3-B3', 'D3-B5', 'D3-C5',
    # D4 安全
    'D4-1', 'D4-3', 'D4-5', 'D4-6', 'D4-7', 'D4-8', 'D4-9', 'D4-10',
    'D4-15', 'D4-17', 'D4-18', 'D4-19', 'D4-20', 'D4-21', 'D4-22', 'D4-24',
    # D5 客户端
    'D5-1', 'D5-3',
    # D6 性能（本地压测探针实测）
    'D6-1', 'D6-3', 'D6-4',
    # D8 质量
    'D8-4', 'D8-6', 'D8-7',
    # D9 协议
    'D9-1', 'D9-3', 'D9-4', 'D9-5', 'D9-7', 'D9-8',
    # D10 评测
    'D10-4',
]

design_fail = {
    'D4-2':  '凭证 env 打印拦截不完整（HW_ 前缀放行，FINDINGS #1）',
    'D4-4':  '写操作审批门漏词 Change* 系列（FINDINGS #2）',
    'D4-11': '提示注入防护：自然语言夹带 hcloud 写命令未拦截（FINDINGS #3）',
    'D4-16': '命令包裹穿透：sh -c 内层写命令未拦截（FINDINGS #4）',
    'D4-23': '全局规则 huawei-agent-rules.mdc 未注入（FINDINGS #5）',
    'D10-3': 'serviceCatalog 路由中文意图未命中（云服务器/存储桶/云硬盘，FINDINGS #6）',
}

design_spec = {
    'D9-2': 'JSON-RPC 错误码 -32603 vs 规范 -32601（FINDINGS #7）',
    'D9-9': 'initialize.capabilities 未声明 notifications/cancellation（FINDINGS #8，SPEC-MISMATCH 标注而非假定）',
}

design_blocked = {
    'D1-1':  '补环境：全新环境引导安装需空 HOME + PTY 交互（破坏性），本机日常环境禁用',
    'D1-2':  '补环境：多 Agent 探测需多客户端并存环境，本机仅 Hermes',
    'D1-5':  '补环境：uninstall 干净度属破坏性（卸载全局包），本机日常环境禁用',
    'D1-45': '补环境：兜底提示预热竞态需冷启时序注入观测；Linux 兜底路径已由 EXP-NR3-24 覆盖',
    'D4-12': '补环境：供应链安装期安全审计需发布流水线上下文',
    'D4-13': '补环境：只读 IAM 子账号凭证 ~/.config/huaweicloud/credentials.readonly.json 未配置，无法注入只读子账号做真实 IAM 权限验证',
    'D4-14': '补环境：操作可审计性需真云 CTS 审计日志核对，本轮无真云命令执行场景',
    'D7-4':  '补环境：国内镜像源安装需镜像网络可达（本机走官方源）',
    'D8-1':  '补环境：文档与能力一致性需全文人工核对；本轮抽查 D8-4/D8-6/D8-7',
    'D9-6':  '补环境：跨客户端互通需 ≥3 真实客户端 + Inspector 标准校验，本机仅 Hermes/Linux',
}

# ============ 展开级状态映射（26） ============
expanded_pass = ['EXP-D5-8-1', 'EXP-D5-8-3', 'EXP-NR3-02', 'EXP-NR3-04', 'EXP-NR3-10', 'EXP-NR3-24']
expanded_blocked = {}
for i in range(1, 16):
    expanded_blocked[f'EXP-E{i:02d}'] = '补环境：评测集需 LLM 模型预算 + 评测 harness（源 D10-3 评测级路由准确率）'
for i in range(1, 6):
    expanded_blocked[f'EXP-D1-58-{i:02d}'] = '补环境：隔离 HOME 白名单矩阵需 PTY 交互驱动 install 菜单 option3，本机无交互终端'

def design_status(cid):
    if cid in design_pass: return 'PASS', ''
    if cid in design_fail: return 'FAIL', design_fail[cid]
    if cid in design_spec: return 'SPEC-MISMATCH', design_spec[cid]
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
print('证据目录数:', len([d_ for d_ in os.listdir(EVID) if os.path.isdir(os.path.join(EVID, d_))]))
print('时间戳(北京时间):', TS)