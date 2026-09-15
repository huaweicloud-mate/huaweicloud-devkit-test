# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-16 每日测试回填（v1.1.5）。只写本机 today 目录 daily 副本三 CSV。"""
import csv, os
from datetime import datetime, timezone, timedelta
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
BJT = timezone(timedelta(hours=8))
TS = datetime.now(BJT).strftime("%Y%m%d%H%M%S")

# ===== 设计级：case_id -> (status, evidencePath, blockedReason) =====
DESIGN = {}

# --- PASS（实测+证据）---
PASS_DESIGN = {
    # D1 安装/升级域
    "D1-1": "evidence/D1-1", "D1-3": "evidence/D1-3", "D1-4": "evidence/D1-4", "D1-5": "evidence/D1-5",
    "D1-26": "evidence/D1-26", "D1-27": "evidence/D1-27", "D1-28": "evidence/D1-28",
    "D1-30": "evidence/D1-30", "D1-31": "evidence/D1-31", "D1-33": "evidence/D1-33",
    "D1-40": "evidence/D1-40", "D1-41": "evidence/D1-41", "D1-42": "evidence/D1-42",
    "D1-45": "evidence/D1-45", "D1-58": "evidence/D1-58",
    # D2 认证域
    "D2-1": "evidence/D2-1", "D2-2": "evidence/D2-2", "D2-4": "evidence/D2-4",
    "D2-5": "evidence/D2-5", "D2-11": "evidence/D2-11", "D2-12": "evidence/D2-12", "D2-16": "evidence/D2-16",
    # D3 能力域
    "D3-A1": "evidence/D3-A1", "D3-B1": "evidence/D3-B1", "D3-B3": "evidence/D3-B3",
    "D3-B5": "evidence/D3-B5", "D3-C4": "evidence/realcloud-probe", "D3-C5": "evidence/D3-C5",
    # D4 安全域
    "D4-1": "evidence/D4-1", "D4-3": "evidence/D4-3", "D4-4": "evidence/D4-4",
    "D4-5": "evidence/D4-5", "D4-6": "evidence/D4-6", "D4-7": "evidence/D4-7",
    "D4-8": "evidence/D4-8", "D4-9": "evidence/D4-9", "D4-10": "evidence/D4-10",
    "D4-11": "evidence/D4-11", "D4-14": "evidence/realcloud-probe", "D4-15": "evidence/D4-15",
    "D4-18": "evidence/realcloud-probe", "D4-19": "evidence/D4-19", "D4-20": "evidence/realcloud-probe",
    "D4-22": "evidence/D4-22",
    # D5/D6/D8/D9
    "D5-1": "evidence/D5-1", "D5-3": "evidence/D5-3",
    "D6-1": "evidence/D6-1", "D6-3": "evidence/D6-3", "D6-4": "evidence/D6-4",
    "D8-7": "evidence/D8-7",
    "D9-1": "evidence/D9-1", "D9-3": "evidence/D9-3", "D9-4": "evidence/D9-4",
    "D9-5": "evidence/D9-5", "D9-7": "evidence/D9-7", "D9-8": "evidence/D9-8",
}
for cid, ev in PASS_DESIGN.items():
    DESIGN[cid] = ("PASS", ev, "")

# --- FAIL（v1.1.5 实测缺陷）---
FAIL_DESIGN = {
    "D4-2":  ("evidence/D4-2",  ""),
    "D4-13": ("evidence/D4-13", ""),   # 只读子账号 test001 读权限 0/6（见 FINDINGS #非产品缺陷）
    "D4-16": ("evidence/D4-16", ""),
    "D4-17": ("evidence/D4-17", ""),
    "D4-21": ("evidence/D4-21", ""),
    "D9-2":  ("evidence/D9-2",  ""),
    "D10-3": ("evidence/D10-3", ""),
}
for cid, (ev, br) in FAIL_DESIGN.items():
    DESIGN[cid] = ("FAIL", ev, br)

# --- BLOCKED（真·外部依赖）----
BLOCKED_DESIGN = {
    "D1-2":  "【补环境】多 Agent 探测需多客户端并存环境（单机仅 Hermes）",
    "D1-6":  "【补环境】install-hcloud 需 KooCLI 下载源/镜像网络引导，无法实测安装引导+镜像/沙箱提示",
    "D2-10": "【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换）",
    "D2-13": "【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库）",
    "D4-12": "【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道",
    "D4-23": "【补环境】全局规则注入需 11 个 Agent 多机安装目标；且包内未见 huawei-agent-rules.md 制品（grep 全包无命中）",
    "D4-24": "【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟",
    "D7-4":  "【补环境】国内镜像源安装需 GitCode/国内镜像网络 + GITCODE_TOKEN",
    "D9-6":  "【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes）",
    "D9-9":  "【改用例】tools/call 超时协议语义需 inspector 夹具注入 30s 挂起；capabilities.cancellation 实测未声明（探针已确认 false）",
    "D10-4": "【补环境】安全干预有效性需 LLM 评测 harness + 预算门禁（run-eval.mjs 无法代理该层）",
}
for cid, br in BLOCKED_DESIGN.items():
    DESIGN[cid] = ("BLOCKED", "", br)

# --- NOT_RUN（OS 专属 / 文档一致性）---
NOT_RUN_DESIGN = {
    "D1-39": "【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由展开级 EXP-NR3-10 探针 PASS 代表覆盖（disttags 探针已跑）",
    "D8-1":  "【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖",
    "D8-4":  "【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖",
    "D8-6":  "【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖",
}
for cid, br in NOT_RUN_DESIGN.items():
    DESIGN[cid] = ("NOT_RUN", "", br)

# ===== 展开级：case_id -> (status, evidencePath, blockedReason) =====
EXPANDED = {}
EXP_HIT = {"EXP-E06", "EXP-E09", "EXP-E15"}
EXP_MISS = {"EXP-E01", "EXP-E02", "EXP-E03", "EXP-E04", "EXP-E05", "EXP-E07",
            "EXP-E10", "EXP-E11", "EXP-E12", "EXP-E13", "EXP-E14"}
for cid in EXP_MISS:
    EXPANDED[cid] = ("FAIL", "evidence/D10-3", "")
for cid in EXP_HIT:
    EXPANDED[cid] = ("PASS", "evidence/D10-3", "")
EXPANDED["EXP-E08"] = ("PASS", "evidence/EXP-E08", "")

# 服务矩阵 22 服务
for i in range(1, 23):
    EXPANDED[f"EXP-C4-{i:02d}"] = ("PASS", "evidence/realcloud-probe", "")
# D5 客户端矩阵
EXPANDED["EXP-D5-8-1"] = ("PASS", "evidence/D5-1", "")
EXPANDED["EXP-D5-8-3"] = ("PASS", "evidence/D5-3", "")
# NR3 终端矩阵
EXPANDED["EXP-NR3-02"] = ("PASS", "evidence/D1-27", "")
EXPANDED["EXP-NR3-04"] = ("PASS", "evidence/D1-42", "")
EXPANDED["EXP-NR3-10"] = ("PASS", "evidence/EXP-NR3-10", "")
EXPANDED["EXP-NR3-24"] = ("PASS", "evidence/D1-45", "")
# D1-58 白名单矩阵
for i in range(1, 6):
    EXPANDED[f"EXP-D1-58-0{i}"] = ("PASS", "evidence/D1-58", "")


def write(path, rows, fields):
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def backfill_design():
    path = os.path.join(BASE, "用例矩阵-设计级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in DESIGN:
            st, ev, br = DESIGN[cid]
            r["执行状态"] = st
            r["执行时间"] = TS if st != "NOT_RUN" else ""
            r["evidencePath"] = ev
            r["blockedReason"] = br
        else:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
            r["blockedReason"] = "本轮未覆盖"
    write(path, rows, fields)
    return rows


def backfill_expanded():
    path = os.path.join(BASE, "用例矩阵-展开级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in EXPANDED:
            st, ev, br = EXPANDED[cid]
            r["执行状态"] = st
            r["执行时间"] = TS if st != "NOT_RUN" else ""
            r["evidencePath"] = ev
            r["blockedReason"] = br
        else:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
            r["blockedReason"] = "源设计用例未覆盖"
    write(path, rows, fields)
    return rows


def backfill_tracing():
    path = os.path.join(BASE, "需求-设计-证据追踪表.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    covered = set(DESIGN.keys())
    n = 0
    for r in rows:
        cid = (r.get("designCaseId") or "").strip()
        if cid and cid in covered:
            r["执行时间"] = TS
            n += 1
    write(path, rows, fields)
    return rows, n


if __name__ == "__main__":
    r1 = backfill_design()
    r2 = backfill_expanded()
    r3, n = backfill_tracing()
    c1 = Counter((x.get("执行状态") or "").strip() for x in r1)
    c2 = Counter((x.get("执行状态") or "").strip() for x in r2)
    print(f"时间戳: {TS}")
    print(f"设计级 {len(r1)} 行: {dict(c1)}")
    print(f"展开级 {len(r2)} 行: {dict(c2)}")
    print(f"追踪表 {len(r3)} 行, 回填执行时间 {n} 行")