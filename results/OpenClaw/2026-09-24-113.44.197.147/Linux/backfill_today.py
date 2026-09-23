#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""回填 2026-09-24 OpenClaw Linux 每日测试执行状态（v1.1.7-next.1 657ceb7）。"""
import csv, os

D = os.path.dirname(os.path.abspath(__file__))
TS = '20260924060000'

# 设计级回填：ID -> (状态, evidencePath, blockedReason)
design = {
    # D1 安装/升级
    'D1-3': ('PASS','evidence/d1-upgrade',''),
    'D1-4': ('PASS','evidence/d1-upgrade',''),
    'D1-26': ('PASS','evidence/d4-security-misc',''),
    'D1-27': ('PASS','evidence/d1-upgrade',''),
    'D1-28': ('PASS','evidence/d1-upgrade',''),
    'D1-30': ('PASS','evidence/d1-upgrade',''),
    'D1-31': ('PASS','evidence/d1-upgrade',''),
    'D1-33': ('PASS','evidence/d1-upgrade',''),
    'D1-39': ('NOT_RUN','','【调归属】Windows 专属用例（OS 列标注「专属」：Windows 升级检测链 EINVAL/npm.cmd 专属）；Linux 无 npm.cmd/EINVAL 语义，本 OS 结构性不适用。Linux 侧检测链已由源码级 queryDistTagsSync 探针佐证（evidence/d1-upgrade/probe-d1-39-linux.stdout.log dist-tags 含 latest+next）。'),
    'D1-40': ('PASS','evidence/new-cases',''),
    'D1-41': ('PASS','evidence/d1-update-check',''),
    'D1-42': ('PASS','evidence/d1-update-check',''),
    'D1-45': ('PASS','evidence/d1-update-check',''),
    'D1-65': ('PASS','evidence/new-cases',''),
    'D1-66': ('PASS','evidence/new-cases',''),
    'D1-67': ('PASS','evidence/new-cases',''),
    'D1-68': ('PASS','evidence/new-cases',''),
    'D1-69': ('PASS','evidence/new-cases',''),
    'D1-70': ('PASS','evidence/new-cases',''),
    # D2 认证
    'D2-10': ('PASS','evidence/d2-auth',''),
    'D2-11': ('PASS','evidence/d2-auth',''),
    'D2-12': ('PASS','evidence/d2-auth',''),
    'D2-13': ('PASS','evidence/d2-auth',''),
    'D2-16': ('PASS','evidence/d2-auth',''),
    'D2-1': ('PASS','evidence/realcloud',''),
    'D2-2': ('PASS','evidence/d2-auth',''),
    'D2-4': ('PASS','evidence/d2-auth',''),
    'D2-5': ('PASS','evidence/d4-security-misc',''),
    'D2-26': ('PASS','evidence/d2-auth',''),
    'D2-27': ('PASS','evidence/new-cases',''),
    # D3 功能
    'D3-A1': ('PASS','evidence/d3-d5-functional',''),
    'D3-B1': ('PASS','evidence/d4-security-misc',''),
    'D3-B3': ('PASS','evidence/d3-d5-functional',''),
    'D3-B5': ('PASS','evidence/d3-d5-functional',''),
    'D3-C4': ('PASS','evidence/realcloud',''),
    'D3-C5': ('PASS','evidence/d8-skills',''),
    'D3-C13': ('PASS','evidence/realcloud',''),
    'D3-C14': ('PASS','evidence/new-cases',''),
    'D3-S1': ('PASS','evidence/realcloud',''),
    'D3-S2': ('PASS','evidence/realcloud',''),
    'D3-S3': ('BLOCKED','evidence/realcloud','【补环境】真机沙箱 E2E 核心步骤 connect/check_user/upload_project/deploy_nginx 均 PASS，仅 expose 步骤失败：沙箱内 devbridge 0.1.13-release 硬编码网关 cn-north-4-bridge.myhuaweicloud.com 已迁移失效（devbridge host 报 Connection failed/Connection lost），且未预置 0.2.x API Key（/tmp/hw_api_key 不存在，sandbox_credentials 无 api_key 注入），无法升级暴露公网 URL。非 hdk 源码缺陷（hdk 1.1.7-next.1 已支持 api_key 注入路径 + 运行时能力探测）。解除条件：预置 DevBridge API Key（devstation.connect.huaweicloud.com/space/devbridge/apikey）或沙箱镜像更新 devbridge 0.2.x。'),
    'D3-S4': ('PASS','evidence/realcloud',''),
    'D3-S5': ('FAIL','evidence/new-cases',''),
    'D3-S6': ('PASS','evidence/realcloud',''),
    'D3-S7': ('PASS','evidence/realcloud',''),
    'D3-S8': ('PASS','evidence/new-cases',''),
    # D4 安全
    'D4-18': ('PASS','evidence/d4-security-core',''),
    'D4-19': ('PASS','evidence/d4-security-core',''),
    'D4-20': ('PASS','evidence/d4-security-core',''),
    'D4-1': ('PASS','evidence/d4-security-core',''),
    'D4-2': ('FAIL','evidence/d4-security-core',''),
    'D4-3': ('PASS','evidence/d4-security-core',''),
    'D4-4': ('PASS','evidence/d4-security-core',''),
    'D4-5': ('PASS','evidence/d4-security-misc',''),
    'D4-6': ('FAIL','evidence/d4-security-core',''),
    'D4-7': ('FAIL','evidence/d4-security-core',''),
    'D4-8': ('PASS','evidence/d4-security-misc',''),
    'D4-9': ('PASS','evidence/d4-security-core',''),
    'D4-10': ('PASS','evidence/d4-security-misc',''),
    'D4-11': ('PASS','evidence/d4-security-core',''),
    'D4-12': ('PASS','evidence/d4-security-misc',''),
    'D4-13': ('PASS','evidence/realcloud',''),
    'D4-14': ('PASS','evidence/realcloud',''),
    'D4-15': ('PASS','evidence/d4-security-core',''),
    'D4-16': ('FAIL','evidence/d4-security-core',''),
    'D4-17': ('PASS','evidence/d4-security-core',''),
    'D4-21': ('FAIL','evidence/d4-security-core',''),
    'D4-22': ('PASS','evidence/d4-security-core',''),
    'D4-23': ('FAIL','evidence/d4-security-core',''),
    'D4-24': ('PASS','evidence/d4-security-core',''),
    'D4-25': ('FAIL','evidence/new-cases',''),
    'D4-26': ('PASS','evidence/new-cases',''),
    'D4-27': ('FAIL','evidence/d4-security-core',''),
    'D4-28': ('PASS','evidence/new-cases',''),
    'D4-29': ('PASS','evidence/new-cases',''),
    # D5 客户端
    'D5-1': ('PASS','evidence/d3-d5-functional',''),
    'D5-3': ('PASS','evidence/d3-d5-functional',''),
    # D6 性能
    'D6-1': ('PASS','evidence/d6-performance',''),
    'D6-3': ('PASS','evidence/d6-performance',''),
    'D6-4': ('PASS','evidence/d6-performance',''),
    'D6-9': ('PASS','evidence/new-cases',''),
    # D8 质量
    'D8-1': ('PASS','evidence/d8-docs',''),
    'D8-4': ('PASS','evidence/d8-docs',''),
    'D8-6': ('PASS','evidence/d8-docs',''),
    'D8-7': ('PASS','evidence/d8-skills',''),
    'D8-9': ('PASS','evidence/new-cases',''),
    'D8-10': ('PASS','evidence/new-cases',''),
    # D9 协议
    'D9-9': ('SPEC-MISMATCH','evidence/d9-protocol',''),
    'D9-1': ('PASS','evidence/d9-protocol',''),
    'D9-2': ('FAIL','evidence/d9-protocol',''),
    'D9-3': ('PASS','evidence/d9-protocol',''),
    'D9-4': ('FAIL','evidence/d9-protocol',''),
    'D9-5': ('PASS','evidence/d9-protocol',''),
    'D9-6': ('PASS','evidence/d9-protocol',''),
    'D9-7': ('FAIL','evidence/d9-protocol',''),
    'D9-8': ('PASS','evidence/d4-security-misc',''),
    'D9-10': ('PASS','evidence/new-cases',''),
    'D9-11': ('PASS','evidence/new-cases',''),
    # D10 评测
    'D10-3': ('FAIL','evidence/d10-routing',''),
    'D10-4': ('PASS','evidence/d4-security-misc',''),
}

# 展开级回填
expanded = {}
for i in ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22']:
    expanded[f'EXP-C4-{i}'] = ('PASS','evidence/d3-C4-servicematrix','')
expanded['EXP-D5-9-1'] = ('PASS','evidence/d3-d5-functional','')
expanded['EXP-D5-9-3'] = ('PASS','evidence/d3-d5-functional','')
e_pass = {'EXP-E06','EXP-E09','EXP-E15'}
e_blocked = {'EXP-E08'}
for i in range(1,16):
    eid = f'EXP-E{i:02d}'
    if eid in e_pass:
        expanded[eid] = ('PASS','evidence/d10-routing','')
    elif eid in e_blocked:
        expanded[eid] = ('BLOCKED','evidence/d10-routing','【补环境】真实 Agent 会话诊断意图层（"ECS启动失败帮我分析原因"）需真实 LLM Agent 判断是否路由 huaweicloud_explain_error；eval/harness/run-eval.mjs 的 serviceCatalog 确定性路由层无法代理该诊断意图（实测返回 N/A）。缺可交互真实 Agent 会话级 harness（仅 DSH/装了 dsh 客户端可用）。解除条件：接入可交互真实 Agent 客户端会话自动化。')
    else:
        expanded[eid] = ('FAIL','evidence/d10-routing','')

def backfill(fn, mapping):
    with open(fn, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    idx = {n:i for i,n in enumerate(hdr)}
    ist = idx['执行状态']; it = idx['执行时间']; iep = idx['evidencePath']; ibr = idx['blockedReason']
    miss = []
    for row in rows[1:]:
        cid = row[idx['ID']]
        if cid in mapping:
            st, ep, br = mapping[cid]
            row[ist] = st; row[it] = TS; row[iep] = ep; row[ibr] = br
        else:
            miss.append(cid)
    with open(fn, 'w', encoding='utf-8-sig', newline='') as f:
        csv.writer(f).writerows(rows)
    return miss, len(rows)-1

m1, n1 = backfill(os.path.join(D,'用例矩阵-设计级.csv'), design)
m2, n2 = backfill(os.path.join(D,'用例矩阵-展开级.csv'), expanded)
print(f'设计级: {n1} rows, 未映射 {m1}')
print(f'展开级: {n2} rows, 未映射 {m2}')

tf = os.path.join(D,'需求-设计-证据追踪表.csv')
with open(tf, encoding='utf-8-sig', newline='') as f:
    rows = list(csv.reader(f))
hdr = rows[0]
ti = hdr.index('执行时间')
for row in rows[1:]:
    row[ti] = TS
with open(tf, 'w', encoding='utf-8-sig', newline='') as f:
    csv.writer(f).writerows(rows)
print(f'追踪表: {len(rows)-1} rows 执行时间已回填 {TS}')