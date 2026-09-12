# -*- coding: utf-8 -*-
"""汇总更新：把某客户端某 OS 的执行状态，填进 Summary 总矩阵对应「客户端-OS」列。

用法:
    python update_summary.py OpenCode Windows              # 当天
    python update_summary.py OpenCode Linux 2026-09-12     # 指定日期

矩阵列 = 客户端 × OS（如 OpenCode-Windows、OpenCode-Linux，共 20 列），避免双系统结果互相覆盖。
"""
import os, sys, csv, datetime

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]
COLS = [f"{c}-{o}" for c in CLIENTS for o in OSES]   # 20 列
RANK = {"FAIL": 5, "BLOCKED": 4, "SPEC-MISMATCH": 3, "NOT_RUN": 2, "PASS": 1, "": 0}

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def worst(*states):
    s = max(states, key=lambda x: RANK.get(x, 0))
    return s if s else "NOT_RUN"


def update_one(kind, client, os_name, date):
    csrc = os.path.join(REPO, "results", client, date, os_name, f"用例矩阵-{kind}.csv")
    ssrc = os.path.join(REPO, "results", "Summary", f"用例矩阵-{kind}-总执行结果-{date}.csv")
    if not os.path.isfile(csrc) or not os.path.isfile(ssrc):
        print(f"[跳过] 缺少 {kind}：客户端副本={os.path.isfile(csrc)} 总矩阵={os.path.isfile(ssrc)}")
        return
    with open(csrc, encoding="utf-8-sig") as f:
        cmap = {r["ID"]: (r.get("执行状态") or r.get("execution_status") or "") for r in csv.DictReader(f)}
    with open(ssrc, encoding="utf-8-sig") as f:
        srows = list(csv.DictReader(f))

    col = f"{client}-{os_name}"
    if col not in srows[0]:
        print(f"[错误] 总矩阵缺列 {col}，请先重新生成 Summary 矩阵（含 20 个客户端×OS 列）")
        return
    for r in srows:
        st = cmap.get(r["ID"], "")
        if st:
            r[col] = st
        col_vals = [r[c] for c in COLS if r.get(c)]
        r["当日总执行状态"] = worst(*col_vals) if col_vals else r.get("当日总执行状态", "NOT_RUN")
    with open(ssrc, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=srows[0].keys())
        w.writeheader()
        w.writerows(srows)
    filled = sum(1 for r in srows if r.get(col))
    print(f"[{kind}] 已填 {col} 列 {filled}/{len(srows)} 条")


def main():
    if len(sys.argv) < 3:
        print("用法: python update_summary.py <客户端> <OS> [日期]")
        print("客户端:", ", ".join(CLIENTS))
        print("OS:", ", ".join(OSES))
        sys.exit(2)
    client, os_name = sys.argv[1], sys.argv[2]
    if client not in CLIENTS or os_name not in OSES:
        print(f"无效参数，客户端可选 {CLIENTS}，OS 可选 {OSES}")
        sys.exit(2)
    date = sys.argv[3] if len(sys.argv) > 3 else datetime.datetime.now().strftime("%Y-%m-%d")
    update_one("设计级", client, os_name, date)
    update_one("展开级", client, os_name, date)
    print("完成。请同步更新总测试报告的该客户端+OS 执行状态。")


if __name__ == "__main__":
    main()