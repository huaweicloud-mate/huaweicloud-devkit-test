# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-13 每日回归 回填脚本：把真实执行结果回填副本 CSV。

只写 results/Hermes/2026-09-13-124.70.78.131/Linux/ 下的 daily 副本（设计级/展开级）。
执行结果与 evidence/ 目录一一对应，PASS 门禁靠 verify_no_fake_pass.py 机械校验。
"""
import csv, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))

# —— 已执行（有真实证据） ——
# case_id -> (status, evidencePath, blockedReason)
EXECUTED = {
    # D1 安装域
    "D1-1": ("PASS", "evidence/D1-1", ""),
    "D1-3": ("PASS", "evidence/D1-3", ""),
    "D1-4": ("PASS", "evidence/D1-4", ""),
    "D1-5": ("PASS", "evidence/D1-5", ""),
    # D2 认证域
    "D2-4":  ("PASS", "evidence/D2-4", ""),
    "D2-11": ("PASS", "evidence/D2-11", ""),
    "D2-12": ("PASS", "evidence/D2-12", ""),
    # D4 安全域
    "D4-1": ("PASS", "evidence/D4-1", ""),
    "D4-2": ("FAIL", "evidence/D4-2", ""),
    "D4-3": ("PASS", "evidence/D4-3", ""),
    "D4-7": ("PASS", "evidence/D4-7", ""),
    # D5 客户端域
    "D5-3": ("PASS", "evidence/D5-3", ""),
    # D9 协议域
    "D9-1": ("PASS", "evidence/D9-1", ""),
    "D9-2": ("FAIL", "evidence/D9-2", ""),
    "D9-3": ("PASS", "evidence/D9-3", ""),
    "D9-4": ("PASS", "evidence/D9-4", ""),
}

# —— 环境阻塞（单 Linux 终端无法执行） ——
BLOCKED = {
    "D1-39": "Windows 升级检测链专项，Linux 终端无法复现",
    "D3-C4": "服务创建类回归需真云配额（ECS/DevStation），单终端无安全创建删除条件",
    "D7-4":  "国内镜像源安装需 GitCode/国内镜像网络环境",
    "D9-6":  "跨客户端互通需多客户端并存环境，本轮单终端无法覆盖",
    "D10-1": "评测 harness + 预算门禁，本轮无评测环境",
    "D10-2": "评测 harness + 预算门禁，本轮无评测环境",
    "D10-3": "评测 harness + 预算门禁，本轮无评测环境",
    "D10-4": "评测 harness + 预算门禁（安全干预有效性需评测集），本轮无评测环境",
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
            st, ev, _ = EXECUTED[cid]
            r["执行状态"] = st
            r["evidencePath"] = ev
        elif cid in BLOCKED:
            r["执行状态"] = "BLOCKED"
            r["evidencePath"] = ""
        else:
            r["执行状态"] = "NOT_RUN"
            r["evidencePath"] = ""
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return len(rows)


def backfill_expanded():
    path = os.path.join(BASE, "用例矩阵-展开级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    for r in rows:
        # 本轮展开级未执行（83 条枚举多终端/真云/评测，单 Linux 终端覆盖不了）
        r["execution_status"] = "NOT_RUN"
        r["evidencePath"] = ""
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return len(rows)


if __name__ == "__main__":
    from collections import Counter
    n1 = backfill_design()
    n2 = backfill_expanded()
    # 打印回填后统计
    with open(os.path.join(BASE, "用例矩阵-设计级.csv"), encoding="utf-8-sig") as f:
        c1 = Counter((r.get("执行状态") or "").strip() for r in csv.DictReader(f))
    with open(os.path.join(BASE, "用例矩阵-展开级.csv"), encoding="utf-8-sig") as f:
        c2 = Counter((r.get("execution_status") or "").strip() for r in csv.DictReader(f))
    print(f"设计级 {n1} 行: {dict(c1)}")
    print(f"展开级 {n2} 行: {dict(c2)}")