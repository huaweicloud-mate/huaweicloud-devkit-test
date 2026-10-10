# -*- coding: utf-8 -*-
"""趋势度量：从每日汇总矩阵生成跨日质量趋势（对齐 test-panorama-plan §5.1 度量体系）。

数据源: results/Summary/用例矩阵-设计级-总执行结果-<日期>.csv
  - 每行 = 一条设计级用例，每客户端列 = 该客户端当日执行状态（PASS/FAIL/BLOCKED/NOT_RUN/SPEC-MISMATCH）
输出:
  - metrics/trend.csv   : 每日一行：date / total / pass / fail / blocked / notrun / spec /
                          exec_rate(已执行占比) / pass_rate(通过率，BLOCKED 不计分母)
  - metrics/trend.md    : 跨日 Markdown 趋势报告（表 + 摘要 + 风险提示）
统计口径（对齐 §5.1）:
  - 已执行    = PASS + FAIL + SPEC-MISMATCH
  - 执行率    = 已执行 / (total - notrun)
  - 通过率    = PASS / 已执行
  - BLOCKED/NOT_RUN 不计入通过率分母

用法:
    python scripts/trend_metrics.py [--out metrics]
    python scripts/trend_metrics.py --from 2026-10-01     # 只看某日起
"""
import csv
import glob
import os
import re
import sys

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUMMARY_DIR = os.path.join(REPO, "results", "Summary")
DEFAULT_OUT = os.path.join(REPO, "metrics")

STATUS_KEYS = ("PASS", "FAIL", "BLOCKED", "NOT_RUN", "SPEC-MISMATCH")


def _cell_status(val):
    """单元格值 → 归一化状态。支持 'PASS' / 'PASS:11' / '' / 'Skipped-...'。"""
    v = (val or "").strip().upper()
    for k in STATUS_KEYS:
        if v.startswith(k):
            return k
    return None  # 空/未知 → 未统计


def parse_daily(path):
    """解析单个每日汇总 CSV → {PASS, FAIL, BLOCKED, NOT_RUN, SPEC-MISMATCH, total, cells}。

    total = 用例行数；cells = 用例行数 × 客户端列数（单元格粒度）。
    """
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        return None
    hdr = list(rows[0].keys())
    client_cols = [
        c for c in hdr
        if "-" in c and c not in ("ID", "维度", "标题", "优先级")
        and not c.startswith(("汇总", "层级"))
    ]
    counts = {k: 0 for k in STATUS_KEYS}
    for r in rows:
        for c in client_cols:
            s = _cell_status(r.get(c))
            if s:
                counts[s] += 1
    counts["total"] = len(rows)
    counts["cells"] = len(rows) * len(client_cols)
    return counts


def compute_metrics(counts):
    """由计数计算执行率/通过率（对齐 §5.1 口径，基于单元格粒度）。

    done      = PASS + FAIL + SPEC-MISMATCH 单元格数
    eligible  = 总单元格 - NOT_RUN 单元格
    exec_rate = done / eligible
    pass_rate = PASS / done
    """
    total_cells = counts.get("cells") or counts["total"]
    done = counts["PASS"] + counts["FAIL"] + counts["SPEC-MISMATCH"]
    eligible = total_cells - counts["NOT_RUN"]
    exec_rate = (done / eligible * 100) if eligible else 0.0
    pass_rate = (counts["PASS"] / done * 100) if done else 0.0
    return {
        "date": None,
        "total": counts["total"],
        "cells": total_cells,
        "pass": counts["PASS"],
        "fail": counts["FAIL"],
        "blocked": counts["BLOCKED"],
        "notrun": counts["NOT_RUN"],
        "spec": counts["SPEC-MISMATCH"],
        "done": done,
        "exec_rate": round(exec_rate, 1),
        "pass_rate": round(pass_rate, 1),
    }


def collect_trends(summary_dir, date_from=None):
    """扫描 Summary 目录所有设计级总执行结果 CSV，按日期排序收集。"""
    files = sorted(glob.glob(os.path.join(summary_dir, "用例矩阵-设计级-总执行结果-*.csv")))
    rows = []
    for path in files:
        m = re.search(r"(\d{4}-\d{2}-\d{2})\.csv$", path)
        if not m:
            continue
        date = m.group(1)
        if date_from and date < date_from:
            continue
        counts = parse_daily(path)
        if counts is None:
            continue
        rec = compute_metrics(counts)
        rec["date"] = date
        rows.append(rec)
    return rows


def render_md(rows):
    """渲染 Markdown 趋势报告。"""
    lines = ["# 测试质量趋势（每日汇总）", "",
             "> 由 scripts/trend_metrics.py 生成 · 单元格粒度（用例×客户端）· 口径对齐 §5.1",
             "",
             "| 日期 | 用例 | 单元格 | 已执行 | PASS | FAIL | SPEC | BLOCKED | NOT_RUN | 执行率 | 通过率 |",
             "|------|-----:|-------:|-------:|-----:|-----:|-----:|--------:|--------:|-------:|-------:|"]
    for r in rows:
        lines.append(
            f"| {r['date']} | {r['total']} | {r['cells']} | {r['done']} | {r['pass']} | {r['fail']} | {r['spec']} | "
            f"{r['blocked']} | {r['notrun']} | {r['exec_rate']:.1f}% | {r['pass_rate']:.1f}% |"
        )
    if rows:
        latest = rows[-1]
        window = rows[-7:]
        avg_pass = sum(r["pass_rate"] for r in window) / len(window)
        avg_exec = sum(r["exec_rate"] for r in window) / len(window)
        lines += [
            "",
            "## 摘要",
            f"- 覆盖范围: {rows[0]['date']} → {latest['date']}（{len(rows)} 天）",
            f"- 最新通过率: {latest['pass_rate']:.1f}% · 最近7日均值 {avg_pass:.1f}%",
            f"- 最新执行率: {latest['exec_rate']:.1f}% · 最近7日均值 {avg_exec:.1f}%",
            f"- 最新: PASS {latest['pass']} · FAIL {latest['fail']} · SPEC {latest['spec']} · BLOCKED {latest['blocked']}",
            f"- 历史峰值通过率: {max(r['pass_rate'] for r in rows):.1f}% · 谷值 {min(r['pass_rate'] for r in rows):.1f}%",
        ]
        if latest["fail"] + latest["spec"] > 0:
            trend_str = " → ".join("{:.0f}%".format(r["pass_rate"]) for r in window)
            lines += [
                "",
                "## 风险提示",
                f"- 最新一轮仍有 {latest['fail']} FAIL + {latest['spec']} SPEC-MISMATCH，建议按提单纪律处理",
                f"- 通过率近7日趋势: {trend_str}",
            ]
    return "\n".join(lines) + "\n"


def main():
    out_dir = DEFAULT_OUT
    date_from = None
    i = 0
    while i < len(sys.argv):
        a = sys.argv[i]
        if a == "--out" and i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith("--"):
            out_dir = sys.argv[i + 1]
            i += 1
        elif a == "--from" and i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith("--"):
            date_from = sys.argv[i + 1]
            i += 1
        i += 1

    if not os.path.isdir(SUMMARY_DIR):
        print(f"[BLOCKED] 未找到 Summary 目录: {SUMMARY_DIR}")
        sys.exit(2)
    rows = collect_trends(SUMMARY_DIR, date_from)
    if not rows:
        print(f"[WARN] 未解析到任何每日汇总（{SUMMARY_DIR}）")
        sys.exit(0)

    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, "trend.csv")
    md_path = os.path.join(out_dir, "trend.md")
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["date", "total", "cells", "done", "pass", "fail", "spec", "blocked", "notrun", "exec_rate", "pass_rate"])
        w.writeheader()
        for r in rows:
            w.writerow(r)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(render_md(rows))
    print(f"趋势: {csv_path}（{len(rows)} 天）")
    print(f"报告: {md_path}")
    latest = rows[-1]
    print(f"最新 {latest['date']}: 执行率 {latest['exec_rate']:.1f}% · 通过率 {latest['pass_rate']:.1f}%")


if __name__ == "__main__":
    main()