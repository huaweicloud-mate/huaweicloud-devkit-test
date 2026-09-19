#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AtomCode 2026-09-20 Linux 每日测试回填：执行状态 + 执行时间 + evidencePath + blockedReason。
基于本机实测探针 stdout（SUT v1.1.5 gitHead e7ed6f6）回填，evidencePath 指向本日 evidence/ 下的新鲜 stdout.log。"""
import csv, os, datetime

BASE = os.path.dirname(os.path.abspath(__file__))

def beijing_now():
    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo("Asia/Shanghai")
    except Exception:
        tz = datetime.timezone(datetime.timedelta(hours=8))
    return datetime.datetime.now(tz).strftime("%Y%m%d%H%M%S")

TS = beijing_now()

# 设计级：ID -> (状态, evidencePath, blockedReason)
DESIGN = {
    # P0
    "D1-39": ("NOT_RUN", "", "OS专属：Windows 升级检测链 EINVAL/npm.cmd 专属；Linux 结构性不适用，Linux 侧由源码级 queryDistTagsSync 探针佐证(evidence/d1-upgrade/probe-d1-39-linux.stdout.log：dist-tags 含 latest+next)"),
    "D1-40": ("PASS", "evidence/d1-upgrade/probe-d1-upgrade.stdout.log", ""),
    "D2-11": ("PASS", "evidence/d2-auth/probe-d2-11-r3-sts.stdout.log", ""),
    "D4-18": ("PASS", "evidence/d4-security-core/probe-d4-18-20-confirm.stdout.log", ""),
    "D4-19": ("PASS", "evidence/d4-security-core/probe-d4-18-20-confirm.stdout.log", ""),
    "D2-4": ("PASS", "evidence/d2-auth/probe-d2-auth.stdout.log", ""),
    "D4-1": ("PASS", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-2": ("FAIL", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-3": ("PASS", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-5": ("PASS", "evidence/d4-security-misc/probe-misc.stdout.log", ""),
    "D4-9": ("PASS", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-15": ("PASS", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-16": ("FAIL", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-21": ("FAIL", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-22": ("PASS", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-23": ("FAIL", "evidence/d4-security-core/probe-d4-23-rules.stdout.log", ""),
    "D4-28": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D8-7": ("PASS", "evidence/d8-skills/probe-d8-7-skills.stdout.log", ""),
    "D10-4": ("PASS", "evidence/d4-security-misc/probe-d10-4-security-intervention.stdout.log", ""),
    # P1
    "D1-3": ("PASS", "evidence/d1-upgrade/probe-d1-cli.stdout.log", ""),
    "D1-26": ("PASS", "evidence/d4-security-misc/probe-misc.stdout.log", ""),
    "D1-27": ("PASS", "evidence/d1-upgrade/probe-d1-upgrade.stdout.log", ""),
    "D1-28": ("PASS", "evidence/d1-upgrade/probe-d1-upgrade.stdout.log", ""),
    "D1-31": ("PASS", "evidence/d1-upgrade/probe-d1-upgrade.stdout.log", ""),
    "D1-41": ("PASS", "evidence/d1-update-check/probe-d1-update-check.stdout.log", ""),
    "D1-42": ("PASS", "evidence/d1-update-check/probe-d1-update-check.stdout.log", ""),
    "D1-45": ("PASS", "evidence/d1-update-check/probe-d1-update-check.stdout.log", ""),
    "D1-70": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-C4": ("PASS", "evidence/realcloud/probe-realcloud.stdout.log", ""),
    "D3-C5": ("PASS", "evidence/d8-skills/probe-d8-7-skills.stdout.log", ""),
    "D2-1": ("PASS", "evidence/realcloud/probe-realcloud.stdout.log", ""),
    "D2-5": ("PASS", "evidence/d4-security-misc/probe-misc.stdout.log", ""),
    "D2-10": ("PASS", "evidence/d2-auth/probe-d2-2-10-status.stdout.log", ""),
    "D2-12": ("PASS", "evidence/d2-auth/probe-d2-auth.stdout.log", ""),
    "D2-13": ("PASS", "evidence/d2-auth/probe-d2-auth.stdout.log", ""),
    "D2-16": ("PASS", "evidence/realcloud/probe-realcloud.stdout.log", ""),
    "D2-26": ("PASS", "evidence/d2-auth/probe-d2-26-backup-restore.stdout.log", ""),
    "D3-A1": ("PASS", "evidence/d3-d5-functional/probe-d3-d5.stdout.log", ""),
    "D3-B3": ("PASS", "evidence/d3-d5-functional/probe-d3-b3-readonly.stdout.log", ""),
    "D3-C13": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-S1": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-S2": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-S3": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-S4": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-S7": ("BLOCKED", "", "需真实 RDS+沙箱多服务编排会话自动化(建库→部署→连接串注入→读写验证→归零)，本客户端无 dsh/CDP agent 会话 harness；serviceCatalog 多路路由层已测，E2E 编排不可自动化"),
    "D3-S8": ("FAIL", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D4-4": ("PASS", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-6": ("FAIL", "evidence/d4-security-core/probe-d4-6-adminpass.stdout.log", ""),
    "D4-7": ("FAIL", "evidence/d4-security-core/probe-d4-7-hooks.stdout.log", ""),
    "D4-8": ("PASS", "evidence/d4-security-misc/probe-misc.stdout.log", ""),
    "D4-11": ("PASS", "evidence/d4-security-core/probe-p0-security.stdout.log", ""),
    "D4-13": ("PASS", "evidence/realcloud/probe-realcloud.stdout.log", ""),
    "D4-17": ("PASS", "evidence/d4-security-misc/probe-misc.stdout.log", ""),
    "D4-20": ("PASS", "evidence/d4-security-core/probe-d4-18-20-confirm.stdout.log", ""),
    "D4-24": ("PASS", "evidence/d4-security-core/probe-d4-24-token.stdout.log", ""),
    "D4-27": ("FAIL", "evidence/d4-security-core/probe-d4-27-redact.stdout.log", ""),
    "D5-1": ("PASS", "evidence/d3-d5-functional/probe-d3-d5.stdout.log", ""),
    "D5-3": ("PASS", "evidence/d3-d5-functional/probe-d3-d5.stdout.log", ""),
    "D6-4": ("PASS", "evidence/d6-performance/probe-d6-perf.stdout.log", ""),
    "D8-4": ("PASS", "evidence/d8-docs/probe-d8-docs.stdout.log", ""),
    "D9-1": ("PASS", "evidence/d9-protocol/probe-d9-mcp-protocol.stdout.log", ""),
    "D9-2": ("FAIL", "evidence/d9-protocol/probe-d9-2-invalid.stdout.log", ""),
    "D9-3": ("PASS", "evidence/d9-protocol/probe-d9-mcp-protocol.stdout.log", ""),
    "D9-4": ("FAIL", "evidence/d9-protocol/probe-d9-edge.stdout.log", ""),
    "D9-5": ("PASS", "evidence/d9-protocol/probe-d9-mcp-protocol.stdout.log", ""),
    "D9-6": ("BLOCKED", "", "需官方 MCP Inspector 校验 + ≥2 客户端互通冒烟环境；本客户端无 Inspector 集成/多客户端会话自动化"),
    "D9-9": ("SPEC-MISMATCH", "evidence/d9-protocol/probe-d9-mcp-protocol.stdout.log", ""),
    "D9-10": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D9-11": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D10-3": ("FAIL", "evidence/d10-routing/probe-d10-routing.stdout.log", ""),
    # P2
    "D1-4": ("PASS", "evidence/d1-upgrade/probe-d1-install-update.stdout.log", ""),
    "D1-30": ("PASS", "evidence/d1-upgrade/probe-d1-upgrade.stdout.log", ""),
    "D1-33": ("PASS", "evidence/d1-upgrade/probe-d1-upgrade.stdout.log", ""),
    "D1-65": ("PASS", "evidence/supplement/probe-supplement2.stdout.log", ""),
    "D1-66": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D1-67": ("BLOCKED", "", "需真实 DSH 插件安装/跳过验证(破坏性全局安装，run-only 不执行)；AGENT_TOOLKIT_MODE/SKIP_DSH 注入需实装 DSH 客户端"),
    "D1-68": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D1-69": ("PASS", "evidence/supplement/probe-supplement2.stdout.log", ""),
    "D2-2": ("PASS", "evidence/d2-auth/probe-d2-2-10-status.stdout.log", ""),
    "D2-27": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-B1": ("PASS", "evidence/d4-security-misc/probe-misc.stdout.log", ""),
    "D3-B5": ("PASS", "evidence/d3-d5-functional/probe-d3-d5.stdout.log", ""),
    "D3-C14": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-S5": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D3-S6": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D4-10": ("PASS", "evidence/d4-security-misc/probe-d1-2-d4-10.stdout.log", ""),
    "D4-12": ("PASS", "evidence/d4-security-misc/probe-d4-12-supplychain.stdout.log", ""),
    "D4-14": ("PASS", "evidence/realcloud/probe-realcloud.stdout.log", ""),
    "D4-25": ("FAIL", "evidence/supplement/probe-supplement2.stdout.log", ""),
    "D4-26": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D4-29": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D6-1": ("PASS", "evidence/d6-performance/probe-d6-perf.stdout.log", ""),
    "D6-3": ("PASS", "evidence/d6-performance/probe-d6-perf.stdout.log", ""),
    "D6-9": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D8-1": ("PASS", "evidence/d8-docs/probe-d8-docs.stdout.log", ""),
    "D8-6": ("PASS", "evidence/d8-docs/probe-d8-docs.stdout.log", ""),
    "D8-9": ("FAIL", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D8-10": ("PASS", "evidence/supplement/probe-supplement.stdout.log", ""),
    "D9-7": ("FAIL", "evidence/d9-protocol/probe-d9-edge.stdout.log", ""),
    "D9-8": ("PASS", "evidence/d4-security-misc/probe-misc.stdout.log", ""),
}

# 展开级：ID -> (状态, evidencePath, blockedReason)
EXPANDED = {}
for i in range(1, 23):
    EXPANDED[f"EXP-C4-{i:02d}"] = ("PASS", "evidence/d3-C4-servicematrix/probe-servicematrix.stdout.log", "")
EXPANDED["EXP-D5-10-1"] = ("PASS", "evidence/d3-d5-functional/probe-d3-d5.stdout.log", "")
EXPANDED["EXP-D5-10-3"] = ("PASS", "evidence/d3-d5-functional/probe-d3-d5.stdout.log", "")
e_pass = {"EXP-E06", "EXP-E08", "EXP-E09", "EXP-E15"}
for i in range(1, 16):
    eid = f"EXP-E{i:02d}"
    if eid in e_pass:
        EXPANDED[eid] = ("PASS", "evidence/d10-routing/probe-d10-routing.stdout.log", "")
    else:
        EXPANDED[eid] = ("FAIL", "evidence/d10-routing/probe-d10-routing.stdout.log", "")

def backfill_4col(path, mapping):
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    idx = {n: i for i, n in enumerate(hdr)}
    ist, it, iep, ibr = idx["执行状态"], idx["执行时间"], idx["evidencePath"], idx["blockedReason"]
    miss = []
    for row in rows[1:]:
        cid = row[idx["ID"]].strip()
        if cid in mapping:
            st, ep, br = mapping[cid]
            row[ist], row[it], row[iep], row[ibr] = st, TS, ep, br
        else:
            miss.append(cid)
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(rows)
    return miss, len(rows) - 1

m1, n1 = backfill_4col(os.path.join(BASE, "用例矩阵-设计级.csv"), DESIGN)
m2, n2 = backfill_4col(os.path.join(BASE, "用例矩阵-展开级.csv"), EXPANDED)
print(f"设计级: {n1} 行, 未映射 {m1}")
print(f"展开级: {n2} 行, 未映射 {m2}")

tf = os.path.join(BASE, "需求-设计-证据追踪表.csv")
with open(tf, encoding="utf-8-sig", newline="") as f:
    rows = list(csv.reader(f))
hdr = rows[0]
ti = hdr.index("执行时间")
for row in rows[1:]:
    row[ti] = TS
with open(tf, "w", encoding="utf-8-sig", newline="") as f:
    csv.writer(f).writerows(rows)
print(f"追踪表: {len(rows)-1} 行 执行时间回填 {TS}")