# -*- coding: utf-8 -*-
"""OpenClaw/Linux 每日测试执行状态回填（只动自己目录的 3 份 CSV 副本）。

状态口径：PASS(有证据) / FAIL(有根因) / BLOCKED / NOT_RUN。无证据一律 NOT_RUN，不虚报。
"""
import csv
import os

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
PACK = os.path.join(REPO, "results", "OpenClaw", "2026-09-13-113.44.197.147", "Linux")

DESIGN = os.path.join(PACK, "用例矩阵-设计级.csv")
EXPANDED = os.path.join(PACK, "用例矩阵-展开级.csv")

# ---------------- 设计级执行结果 ----------------
# 每个用例： (状态, evidencePath)
DESIGN_STATUS = {
    # D1 安装/升级检测链
    "D1-26": ("PASS", "evidence/d4-security-misc"),
    "D1-27": ("PASS", "evidence/d1-upgrade"),
    "D1-28": ("PASS", "evidence/d1-upgrade"),
    "D1-30": ("PASS", "evidence/d1-upgrade"),
    "D1-31": ("PASS", "evidence/d1-upgrade"),
    "D1-33": ("PASS", "evidence/d1-upgrade"),
    "D1-40": ("PASS", "evidence/d1-upgrade"),
    # D1 需真实安装/PTY/跨进程注入/白名单给 merge —— NOT_RUN
    "D1-1": ("NOT_RUN", ""),
    "D1-2": ("NOT_RUN", ""),
    "D1-3": ("NOT_RUN", ""),
    "D1-4": ("NOT_RUN", ""),
    "D1-5": ("NOT_RUN", ""),
    "D1-6": ("NOT_RUN", ""),
    "D1-39": ("NOT_RUN", ""),   # Windows EINVAL 场景，Linux 单机无法复现
    "D1-41": ("NOT_RUN", ""),
    "D1-42": ("NOT_RUN", ""),
    "D1-45": ("NOT_RUN", ""),
    "D1-58": ("NOT_RUN", ""),
    # D2 认证
    "D2-2": ("PASS", "evidence/d2-auth"),
    "D2-4": ("PASS", "evidence/d2-auth"),
    "D2-5": ("PASS", "evidence/d4-security-misc"),
    "D2-10": ("PASS", "evidence/d2-auth"),
    "D2-11": ("PASS", "evidence/d2-auth"),
    "D2-12": ("PASS", "evidence/d2-auth"),
    "D2-13": ("PASS", "evidence/d2-auth"),
    "D2-16": ("PASS", "evidence/d2-auth"),
    "D2-1": ("NOT_RUN", ""),   # auth init 三端同步需真实终端逐步落位
    # D3 功能
    "D3-A1": ("PASS", "evidence/d3-d5-functional"),
    "D3-B1": ("PASS", "evidence/d4-security-misc"),
    "D3-B3": ("PASS", "evidence/d3-d5-functional"),
    "D3-B5": ("PASS", "evidence/d3-d5-functional"),
    "D3-C4": ("NOT_RUN", ""),  # 真云服务创建类回归，红线要求最小配置+删除，未执行真云
    "D3-C5": ("PASS", "evidence/d8-skills"),
    # D4 安全
    "D4-1": ("PASS", "evidence/d4-security-core"),
    "D4-2": ("FAIL", "evidence/d4-security-core"),
    "D4-3": ("PASS", "evidence/d4-security-core"),
    "D4-4": ("PASS", "evidence/d4-security-core"),
    "D4-5": ("PASS", "evidence/d4-security-misc"),
    "D4-6": ("FAIL", "evidence/d4-security-core"),
    "D4-7": ("FAIL", "evidence/d4-security-core"),
    "D4-8": ("PASS", "evidence/d4-security-misc"),
    "D4-9": ("PASS", "evidence/d4-security-core"),
    "D4-10": ("NOT_RUN", ""),
    "D4-11": ("PASS", "evidence/d4-security-core"),
    "D4-12": ("NOT_RUN", ""),
    "D4-13": ("NOT_RUN", ""),
    "D4-14": ("NOT_RUN", ""),
    "D4-15": ("PASS", "evidence/d4-security-core"),
    "D4-16": ("FAIL", "evidence/d4-security-core"),
    "D4-17": ("PASS", "evidence/d4-security-misc"),
    "D4-18": ("PASS", "evidence/d4-security-core"),
    "D4-19": ("PASS", "evidence/d4-security-core"),
    "D4-20": ("PASS", "evidence/d4-security-core"),
    "D4-21": ("FAIL", "evidence/d4-security-core"),
    "D4-22": ("PASS", "evidence/d4-security-core"),
    "D4-23": ("FAIL", "evidence/d4-security-core"),
    "D4-24": ("NOT_RUN", ""),  # 需真云+可注入时钟确认流
    # D5 客户端
    "D5-1": ("PASS", "evidence/d3-d5-functional"),
    "D5-3": ("PASS", "evidence/d3-d5-functional"),
    # D6 性能
    "D6-1": ("PASS", "evidence/d6-performance"),
    "D6-3": ("PASS", "evidence/d6-performance"),
    "D6-4": ("PASS", "evidence/d6-performance"),
    # D7 兼容
    "D7-4": ("PASS", "evidence/d8-docs"),
    # D8 质量
    "D8-1": ("PASS", "evidence/d8-docs"),
    "D8-4": ("PASS", "evidence/d8-docs"),
    "D8-6": ("PASS", "evidence/d8-docs"),
    "D8-7": ("PASS", "evidence/d8-skills"),
    # D9 协议
    "D9-1": ("PASS", "evidence/d9-protocol"),
    "D9-2": ("FAIL", "evidence/d9-protocol"),
    "D9-3": ("PASS", "evidence/d9-protocol"),
    "D9-4": ("NOT_RUN", ""),
    "D9-5": ("PASS", "evidence/d9-protocol"),
    "D9-6": ("NOT_RUN", ""),  # 跨客户端互通需多客户端环境
    "D9-7": ("NOT_RUN", ""),
    "D9-8": ("PASS", "evidence/d4-security-misc"),
    "D9-9": ("NOT_RUN", ""),  # 需可注入延迟夹具 + capabilities.cancellation
    # D10 评测
    "D10-1": ("NOT_RUN", ""),
    "D10-2": ("NOT_RUN", ""),
    "D10-3": ("NOT_RUN", ""),
    "D10-4": ("NOT_RUN", ""),
    "D10-5": ("NOT_RUN", ""),
}


def apply_design():
    with open(DESIGN, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    assert "执行状态" in fields and "evidencePath" in fields, fields
    n = 0
    for r in rows:
        cid = r.get("ID", "").strip()
        if cid in DESIGN_STATUS:
            st, ev = DESIGN_STATUS[cid]
            r["执行状态"] = st
            r["evidencePath"] = ev
            n += 1
    # 未显式给出的用例一律 NOT_RUN（防漏标虚报）
    for r in rows:
        if not (r.get("执行状态") or "").strip():
            r["执行状态"] = "NOT_RUN"
            r["evidencePath"] = ""
    with open(DESIGN, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"设计级回填 {n} 条（含 NOT_RUN 兜底）")


def apply_expanded():
    with open(EXPANDED, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    assert "execution_status" in fields and "evidencePath" in fields, fields
    # OpenClaw 客户端矩阵两行（D5-1/D5-3 展开）标 PASS；其余 NOT_RUN
    for r in rows:
        cid = r.get("ID", "").strip()
        if cid in ("EXP-D5-9-1", "EXP-D5-9-3"):
            r["execution_status"] = "PASS"
            r["evidencePath"] = "evidence/d3-d5-functional"
        else:
            if not (r.get("execution_status") or "").strip():
                r["execution_status"] = "NOT_RUN"
                r["evidencePath"] = ""
    with open(EXPANDED, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"展开级回填完成 ({len(rows)} 行)")


if __name__ == "__main__":
    apply_design()
    apply_expanded()
    # 汇总
    from collections import Counter
    c = Counter(r["执行状态"] for r in csv.DictReader(open(DESIGN, encoding="utf-8-sig")))
    print("设计级状态汇总:", dict(c))
    c2 = Counter(r["execution_status"] for r in csv.DictReader(open(EXPANDED, encoding="utf-8-sig")))
    print("展开级状态汇总:", dict(c2))