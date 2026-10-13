# -*- coding: utf-8 -*-
import csv
import os

BASE = r"C:\Users\Administrator\devkit-test\officeace\huaweicloud-devkit-test\results\OfficeAce"

dirs = [
    "2026-10-06-188.239.14.150",
    "2026-10-07-188.239.14.150",
    "2026-10-08-188.239.14.150",
    "2026-10-09-188.239.14.150",
    "2026-10-10-119.8.181.45",
    "2026-10-11-119.8.181.45",
    "2026-10-12-119.8.181.45",
]

files = [
    ("设计级", r"Windows\用例矩阵-设计级.csv"),
    ("展开级", r"Windows\用例矩阵-展开级.csv"),
]


def analyze_csv(path):
    """Return dict with total, PASS, FAIL, BLOCKED, not_run counts."""
    stats = {"total": 0, "PASS": 0, "FAIL": 0, "BLOCKED": 0, "not_run": 0}
    if not os.path.isfile(path):
        stats["error"] = "FILE_NOT_FOUND"
        return stats
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            stats["total"] += 1
            status = (row.get("执行状态") or "").strip()
            if status == "PASS":
                stats["PASS"] += 1
            elif status == "FAIL":
                stats["FAIL"] += 1
            elif status == "BLOCKED":
                stats["BLOCKED"] += 1
            elif status in ("", "NOT_RUN"):
                stats["not_run"] += 1
            else:
                # Any other status counts as not-run / unknown
                stats["not_run"] += 1
    return stats


# Collect results
results = []
for d in dirs:
    date_part = d.split("-188")[0].split("-119")[0]
    row = {"date": date_part, "dir": d}
    for label, relpath in files:
        full = os.path.join(BASE, d, relpath)
        row[label] = analyze_csv(full)
    results.append(row)

# Print detailed table
print("=" * 120)
print(f"{'日期':<12} | {'设计级 PASS/总':>16} | {'设计级 FAIL':>10} | {'设计级 BLK':>10} | {'设计级 空':>10} | {'展开级 PASS/总':>16} | {'展开级 FAIL':>10} | {'展开级 BLK':>10} | {'展开级 空':>10} | {'真正执行':>8}")
print("-" * 120)

for r in results:
    d = r["设计级"]
    e = r["展开级"]
    d_pass_total = f"{d['PASS']}/{d['total']}"
    e_pass_total = f"{e['PASS']}/{e['total']}"
    # "真正执行" = has at least one PASS or FAIL across both files
    executed = (d["PASS"] + d["FAIL"] + e["PASS"] + e["FAIL"]) > 0
    exec_str = "YES" if executed else "NO"
    print(f"{r['date']:<12} | {d_pass_total:>16} | {d['FAIL']:>10} | {d['BLOCKED']:>10} | {d['not_run']:>10} | {e_pass_total:>16} | {e['FAIL']:>10} | {e['BLOCKED']:>10} | {e['not_run']:>10} | {exec_str:>8}")

print("=" * 120)

# Summary
print("\n汇总：")
total_design = sum(r["设计级"]["total"] for r in results)
total_expand = sum(r["展开级"]["total"] for r in results)
total_design_pass = sum(r["设计级"]["PASS"] for r in results)
total_expand_pass = sum(r["展开级"]["PASS"] for r in results)
total_design_fail = sum(r["设计级"]["FAIL"] for r in results)
total_expand_fail = sum(r["展开级"]["FAIL"] for r in results)
total_design_blk = sum(r["设计级"]["BLOCKED"] for r in results)
total_expand_blk = sum(r["展开级"]["BLOCKED"] for r in results)
total_design_nr = sum(r["设计级"]["not_run"] for r in results)
total_expand_nr = sum(r["展开级"]["not_run"] for r in results)

print(f"  设计级 — 总用例(7天合计): {total_design}  PASS: {total_design_pass}  FAIL: {total_design_fail}  BLOCKED: {total_design_blk}  空/NOT_RUN: {total_design_nr}")
print(f"  展开级 — 总用例(7天合计): {total_expand}  PASS: {total_expand_pass}  FAIL: {total_expand_fail}  BLOCKED: {total_expand_blk}  空/NOT_RUN: {total_expand_nr}")