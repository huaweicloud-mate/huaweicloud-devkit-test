# -*- coding: utf-8 -*-
"""【已废弃】请改用 build_summary.py——它动态生成列（只列实际执行的 <客户端>-<IP>-<OS>），支持多机。

本脚本为早期实现：固定 20 列（客户端×OS 全量）、路径不含 IP（results/<client>/<date>/<os>），
与当前带 IP 的多机结构已脱节，且无任何调用者。保留仅作历史参考。
"""
import os, sys, csv, datetime

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]
COLS = [f"{c}-{o}" for c in CLIENTS for o in OSES]

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def gen(kind, src_rel, id_key, name_keys, status_key, date):
    src = os.path.join(REPO, *src_rel)
    if not os.path.isfile(src):
        print(f"[错误] daily 精选缺失: {src}")
        sys.exit(3)
    with open(src, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    out = os.path.join(REPO, "results", "Summary", f"用例矩阵-{kind}-总执行结果-{date}.csv")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    headers = ["层级", "ID"] + name_keys + ["优先级"] + COLS + ["当日总执行状态", "当日总执行时间"]
    with open(out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for r in rows:
            base = ["设计级" if kind == "设计级" else "展开级", r[id_key]] + [r.get(k, "") for k in name_keys] + [r.get("优先级", "")]
            w.writerow(base + [""] * len(COLS) + [r.get(status_key, ""), ""])
    print(f"[{kind}] {os.path.basename(out)} {len(rows)} 行 × {len(COLS)} 列")


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y-%m-%d")
    gen("设计级", ("test-cases", "daily", "用例矩阵-设计级.csv"), "ID", ["维度", "标题"], "执行状态", date)
    gen("展开级", ("test-cases", "daily", "用例矩阵-展开级.csv"), "ID", ["展开类型", "枚举对象", "源用例"], "执行状态", date)
    print("完成。后续用 update_summary.py 把各客户端+OS 执行状态填进对应列。")


if __name__ == "__main__":
    main()