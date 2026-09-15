# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-15 每日回归 回填脚本：把真实执行结果回填副本 CSV。

只写 results/Hermes/2026-09-15-124.70.78.131/Linux/ 下 daily 副本（设计级/展开级/追踪表）。
PASS 门禁靠 scripts/verify_no_fake_pass.py 机械校验（PASS 必有 evidencePath 且存在）。
"""
import csv, os
from datetime import datetime
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
TS = datetime.now().strftime("%Y%m%d%H%M%S")   # 北京 14 位紧凑

# —— 已执行（有真实证据） case_id -> (status, evidencePath) ——
EXECUTED = {
    # D1 安装域
    "D1-1":  ("PASS", "evidence/D1-1"),
    "D1-3":  ("PASS", "evidence/D1-3"),
    "D1-4":  ("PASS", "evidence/D1-4"),
    "D1-5":  ("PASS", "evidence/D1-5"),
    "D1-41": ("PASS", "evidence/D1-41"),
    # D2 认证域
    "D2-4":  ("PASS", "evidence/D2-4"),
    "D2-11": ("PASS", "evidence/D2-11"),
    "D2-12": ("PASS", "evidence/D2-12"),
    "D2-16": ("PASS", "evidence/D2-16"),
    # D4 安全域
    "D4-1":  ("PASS", "evidence/D4-1"),
    "D4-2":  ("FAIL", "evidence/D4-2"),
    "D4-3":  ("PASS", "evidence/D4-3"),
    "D4-5":  ("PASS", "evidence/D4-5"),
    "D4-7":  ("PASS", "evidence/D4-7"),
    "D4-8":  ("PASS", "evidence/D4-8"),
    "D4-9":  ("PASS", "evidence/D4-9"),
    "D4-15": ("PASS", "evidence/D4-15"),
    "D4-16": ("FAIL", "evidence/D4-16"),
    "D4-21": ("FAIL", "evidence/D4-21"),
    "D4-22": ("PASS", "evidence/D4-22"),
    # D5 客户端域
    "D5-3":  ("PASS", "evidence/D5-3"),
    # D8 质量域
    "D8-7":  ("PASS", "evidence/D8-7"),
    # D9 协议域
    "D9-1":  ("PASS", "evidence/D9-1"),
    "D9-2":  ("FAIL", "evidence/D9-2"),
    "D9-3":  ("PASS", "evidence/D9-3"),
    "D9-4":  ("PASS", "evidence/D9-4"),
    "D9-5":  ("PASS", "evidence/D9-5"),
    "D9-7":  ("PASS", "evidence/D9-7"),
    "D9-8":  ("PASS", "evidence/D9-8"),
}

# —— 环境阻塞（单 Linux 终端无法执行）→ blockedReason 落报告，CSV 只标 BLOCKED ——
BLOCKED = [
    "D1-39", "D1-40",
    "D3-C4",
    "D4-18", "D4-19", "D4-23",
    "D7-4",
    "D9-6", "D9-9",
    "D10-1", "D10-2", "D10-3", "D10-4", "D10-5",
]

BLOCKED_REASON = {
    "D1-39": "Windows 升级检测链专项，Linux 终端无法复现",
    "D1-40": "镜像 lag 检测需镜像源/Windows 环境",
    "D3-C4": "服务创建类回归需真云配额（ECS/DevStation），单终端无安全创建删除条件",
    "D4-18": "confirm-not-deny 审批语义需真云+标准客户端交互确认流",
    "D4-19": "确认流下预检需真云高危操作进入确认流",
    "D4-23": "全局规则注入需 11 个 Agent 安装目标，单机仅 Hermes；源码未见 huawei-agent-rules.md 制品",
    "D7-4": "国内镜像源安装需 GitCode/国内镜像网络环境",
    "D9-6": "跨客户端互通需多客户端并存环境",
    "D9-9": "需 inspector/延迟 MCP 客户端夹具注入 30s 挂起以验证 -32000 超时与取消语义",
    "D10-1": "评测 harness + 预算门禁，本轮无评测环境",
    "D10-2": "评测 harness + 预算门禁，本轮无评测环境",
    "D10-3": "评测 harness + 预算门禁，本轮无评测环境",
    "D10-4": "评测 harness + 预算门禁（安全干预有效性需评测集）",
    "D10-5": "评测 harness + 预算门禁，本轮无评测环境",
}


def backfill_design():
    path = os.path.join(BASE, "用例矩阵-设计级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in EXECUTED:
            st, ev = EXECUTED[cid]
            r["执行状态"] = st
            r["执行时间"] = TS
            r["evidencePath"] = ev
        elif cid in BLOCKED:
            r["执行状态"] = "BLOCKED"
            r["执行时间"] = TS
            r["evidencePath"] = ""
        else:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return rows


def backfill_expanded():
    """展开级 N×M 矩阵逐格回填：镜像其源设计用例（designCaseId）的执行结论。

    - 源设计 PASS（D5-3）→ 展开格 PASS（复用设计证据 evidence/D5-3）
    - 源设计 BLOCKED（D3-C4 / D1-39 / D10-3）→ 展开格 BLOCKED（同阻塞原因）
    - 源设计 NOT_RUN（D1-27/42/45/58、D5-1）→ 展开格 NOT_RUN
    """
    path = os.path.join(BASE, "用例矩阵-展开级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    pass_ev = {cid: ev for cid, (st, ev) in EXECUTED.items() if st == "PASS"}
    for r in rows:
        src = (r.get("designCaseId") or "").strip()
        if src in pass_ev:
            r["执行状态"] = "PASS"
            r["执行时间"] = TS
            r["evidencePath"] = pass_ev[src]
        elif src in BLOCKED:
            r["执行状态"] = "BLOCKED"
            r["执行时间"] = TS
            r["evidencePath"] = ""
        else:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return rows


def backfill_tracing():
    path = os.path.join(BASE, "需求-设计-证据追踪表.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    covered = set(EXECUTED.keys()) | set(BLOCKED)
    n = 0
    for r in rows:
        cid = (r.get("designCaseId") or "").strip()
        if cid and cid in covered:
            r["执行时间"] = TS
            n += 1
        else:
            r["执行时间"] = r.get("执行时间", "")
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return rows, n


if __name__ == "__main__":
    rows1 = backfill_design()
    rows2 = backfill_expanded()
    rows3, tr_n = backfill_tracing()
    c1 = Counter((r.get("执行状态") or "").strip() for r in rows1)
    c2 = Counter((r.get("执行状态") or "").strip() for r in rows2)
    print(f"时间戳: {TS}")
    print(f"设计级 {len(rows1)} 行: {dict(c1)}")
    print(f"展开级 {len(rows2)} 行: {dict(c2)}")
    print(f"追踪表 {len(rows3)} 行, 回填执行时间 {tr_n} 行")