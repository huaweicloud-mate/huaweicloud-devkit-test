# -*- coding: utf-8 -*-
"""维护者统一汇总：遍历所有「客户端-IP」×OS 的执行结果，生成填充好的 Summary 总矩阵。

用法（维护者，所有 agent 提交后跑一次）:
    python build_summary.py [日期]

说明：方案3——agent 只提交自己 results/<客户端>-<IP>/ 目录，不碰 Summary；
     Summary 由本脚本统一汇总生成。多机同客户端靠 <客户端>-<IP> 区分，矩阵列动态生成。
"""
import os, sys, csv, datetime

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSES = ["Windows", "Linux"]
RANK = {"FAIL": 5, "BLOCKED": 4, "SPEC-MISMATCH": 3, "PARTIAL": 3, "SKIP": 2, "NOT_RUN": 2, "PASS": 1, "": 0}
SKIP_DIRS = {"Summary", "Regression", "Iteration"}


def worst(statuses):
    vals = [s for s in statuses if s]
    if not vals:
        return "NOT_RUN"
    return max(vals, key=lambda x: RANK.get(x, 0))


def find_machine_dirs(date):
    """扫描 results/ 下所有 <客户端>-<IP> 目录（有当日执行副本的）。"""
    results_dir = os.path.join(REPO, "results")
    dirs = []
    if not os.path.isdir(results_dir):
        return dirs
    for d in sorted(os.listdir(results_dir)):
        if d in SKIP_DIRS or not os.path.isdir(os.path.join(results_dir, d)):
            continue
        # 有该日期的任一 OS 副本才纳入
        has = any(os.path.isfile(os.path.join(results_dir, d, date, o, "用例矩阵-设计级.csv"))
                  for o in OSES)
        if has:
            dirs.append(d)
    return dirs


def build(kind, src_rel, id_key, name_keys, status_key, date, machine_dirs, cols):
    src = os.path.join(REPO, *src_rel)
    with open(src, encoding="utf-8-sig") as f:
        base_rows = list(csv.DictReader(f))

    summary = []
    for r in base_rows:
        row = {"层级": "设计级" if kind == "设计级" else "展开级", "ID": r[id_key]}
        for k in name_keys:
            row[k] = r.get(k, "")
        row["优先级"] = r.get("优先级", "")
        for c in cols:
            row[c] = ""
        row["当日总执行状态"] = r.get(status_key, "")
        summary.append(row)

    for machine in machine_dirs:
        for os_name in OSES:
            pack_csv = os.path.join(REPO, "results", machine, date, os_name, f"用例矩阵-{kind}.csv")
            if not os.path.isfile(pack_csv):
                continue
            with open(pack_csv, encoding="utf-8-sig") as f:
                cmap = {r.get(id_key): (r.get(status_key) or "").strip() for r in csv.DictReader(f)}
            col = f"{machine}-{os_name}"
            for row in summary:
                st = cmap.get(row["ID"], "")
                if st:
                    row[col] = st

    for row in summary:
        vals = [row[c] for c in cols if row.get(c)]
        if vals:
            row["当日总执行状态"] = worst(vals)

    out = os.path.join(REPO, "results", "Summary", f"用例矩阵-{kind}-总执行结果-{date}.csv")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    fields = ["层级", "ID"] + name_keys + ["优先级"] + cols + ["当日总执行状态"]
    with open(out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(summary)
    filled = sum(1 for r in summary if any(r[c] for c in cols))
    print(f"[{kind}] {os.path.basename(out)}：{len(summary)} 行，{len(cols)} 列，已填 {filled} 条")


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y-%m-%d")
    machine_dirs = find_machine_dirs(date)
    cols = [f"{d}-{o}" for d in machine_dirs for o in OSES]
    print(f"发现的机器目录: {machine_dirs}")
    build("设计级", ("test-cases", "design", "用例矩阵-设计级.csv"), "ID", ["维度", "标题"], "执行状态", date, machine_dirs, cols)
    build("展开级", ("test-cases", "expanded", "用例矩阵-展开级.csv"), "ID", ["展开类型", "枚举对象", "源用例"], "execution_status", date, machine_dirs, cols)
    print("汇总完成。总报告(.md)请维护者按需生成。")


if __name__ == "__main__":
    main()