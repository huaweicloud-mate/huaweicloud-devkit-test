#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""09-16 补测回填：真云用例用新凭证重跑结果 + probe-daily 源码级重跑 + 其余沿用 09-15 状态。
证据路径相对 pack_dir。只写 results/Hermes/2026-09-16-1.94.218.129/Linux/ 内三个 CSV。
"""
import csv, os, re, shutil, datetime
from pathlib import Path

PACK = Path('results/Hermes/2026-09-16-1.94.218.129/Linux')
PACK15 = Path('results/Hermes/2026-09-15-1.94.218.129/Linux')
EVID = PACK / 'evidence'

def bjts():
    d = datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    return d.strftime('%Y%m%d%H%M%S')

# ---------- 1) 拆分 probe-daily 新鲜输出为逐用例证据 ----------
daily_log = (PACK / 'stdout-daily.log').read_text(encoding='utf-8', errors='replace')
blocks = re.findall(r'@@CASE\s+([\w-]+)@@(.*?)@@END@@', daily_log, re.S)
probe_status = {}  # id -> (PASS/FAIL, detail)
for cid, body in blocks:
    has_fail = 'FAIL  ' in body or re.search(r'\bFAIL\s+', body)
    has_pass = 'PASS  ' in body or re.search(r'\bPASS\s+', body)
    if has_fail:
        probe_status[cid] = ('FAIL', body.strip().splitlines()[0] if body.strip() else '')
    elif has_pass:
        probe_status[cid] = ('PASS', body.strip().splitlines()[0] if body.strip() else '')
    # INFO-only 块（如 D9-2）不覆盖，落入 09-15 沿用
    d = EVID / cid
    d.mkdir(parents=True, exist_ok=True)
    (d / 'stdout.log').write_text(body.strip() + '\n', encoding='utf-8')

# ---------- 2) 真云重跑结果覆盖 ----------
# 设计级真云用例
realcloud_design = {
    'D4-13': ('PASS', 'evidence/D4-13/stdout.log', '真云只读子账号 test001 实测：写操作 CreateVpc 被 IAM 拒绝(VPC.0010 PolicyNotAuthorized)且无资源落库；只读规划工具(list_operations)100% 可用；admin 对照只读成功'),
    'D4-14': ('PASS', 'evidence/D4-14/stdout.log', '真云 CreateVpc→查 CTS(ListTraces 命中 createVpc/createRouter/deleteVpc/deleteRouter)→删除归零(无 hermes-* 残留)'),
    'D3-C4': ('FAIL', 'evidence/D3-C4/stdout.log', '22 服务 20/22 有规范路由；DMS/DEW 为类目名非 KooCLI 服务名(hcloud 返回 Unsupported service)，正确名 Kafka/RabbitMQ/RocketMQ 与 CSMS/KMS 实测有规范路由(改用例建议)。真云最小规格 VPC 创建→释放→归零通过'),
    'D2-1':  ('PASS', 'evidence/D2-1/stdout.log', '真云三端同步：KooCLI/OBS/沙箱三端配置文件落位 + KooCLI ListServersDetails 真调用成功 + 沙箱 resolveCredentials 可用'),
    'D4-18': ('PASS', 'evidence/D4-18/stdout.log', '真云 confirm-not-deny：写操作默认 deny(需确认)，allowWrites=true 放行'),
    'D4-19': ('PASS', 'evidence/D4-19/stdout.log', '真云确认流下预检：公网暴露 SG 规则即使 allowWrites=true 仍 deny'),
    'D4-20': ('PASS', 'evidence/D4-20/stdout.log', '真云拒绝后零操作：approvedByUser=false / 无效 token 均抛错，且无资源落库'),
}
# 展开级 D3-C4 服务矩阵
exp_c4_names = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB']
realcloud_expanded = {}
for i, svc in enumerate(exp_c4_names, 1):
    cid = f'EXP-C4-{i:02d}'
    if svc == 'DMS':
        realcloud_expanded[cid] = ('FAIL', f'evidence/{cid}/stdout.log', 'hcloud DMS=Unsupported service（类目名）；应映射 Kafka/RabbitMQ/RocketMQ，实测 Kafka --help 有规范路由(改用例)')
    elif svc == 'DEW':
        realcloud_expanded[cid] = ('FAIL', f'evidence/{cid}/stdout.log', 'hcloud DEW=Unsupported service（类目名）；应映射 CSMS/KMS，实测 CSMS --help 有规范路由(改用例)')
    else:
        realcloud_expanded[cid] = ('PASS', f'evidence/{cid}/stdout.log', f'{svc} list_operations 返回 Available Operations（规范路由可执行）')

# ---------- 3) 读取 09-15 状态（沿用） ----------
def load_status(path):
    with open(path, encoding='utf-8-sig') as f:
        r = list(csv.reader(f))
    hdr = r[0]
    idx = {h: i for i, h in enumerate(hdr)}
    m = {}
    for row in r[1:]:
        if len(row) <= 1:
            continue
        cid = row[idx['ID']]
        m[cid] = (row[idx['执行状态']], row[idx['evidencePath']], row[idx['blockedReason']], row[idx.get('执行时间', 28)] if '执行时间' in idx else '')
    return m

d15_design = load_status(PACK15 / '用例矩阵-设计级.csv')
d15_expanded = load_status(PACK15 / '用例矩阵-展开级.csv')

# ---------- 4) 回填（设计级 + 展开级） ----------
def backfill(kind, realcloud, d15, src):
    path = PACK / f'用例矩阵-{kind}.csv'
    with open(path, encoding='utf-8-sig') as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    idx = {h: i for i, h in enumerate(hdr)}
    for row in rows[1:]:
        if len(row) <= 1:
            continue
        cid = row[idx['ID']]
        # 优先真云重跑
        if cid in realcloud:
            st, ev, reason = realcloud[cid]
        elif cid in probe_status:
            st, _ = probe_status[cid]
            ev = f'evidence/{cid}/stdout.log'
            reason = ''
        elif cid in d15:
            st, ev, reason, _t = d15[cid]
        else:
            st, ev, reason = 'NOT_RUN', '', '归本客户端但本轮未执行'
        row[idx['执行状态']] = st
        row[idx['evidencePath']] = ev
        row[idx['blockedReason']] = reason
        if cid in realcloud or cid in probe_status:
            row[idx['执行时间']] = bjts()
        elif cid in d15 and not row[idx['执行时间']]:
            row[idx['执行时间']] = d15[cid][3]
    with open(path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(hdr)
        w.writerows(rows[1:])
    print(kind, 'backfilled')

backfill('设计级', realcloud_design, d15_design, 'test-cases/daily/用例矩阵-设计级.csv')
backfill('展开级', realcloud_expanded, d15_expanded, 'test-cases/daily/用例矩阵-展开级.csv')
print('done. evidence dirs:', len(list(EVID.iterdir())))