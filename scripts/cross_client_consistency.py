#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""跨端一致性复核（3-2）：同一用例在不同客户端结论不一致时，自动挑出来给你复核。

痛点：同一 SUT、同一条用例，某机位 FAIL 38 条而其他机位只有 1~13 条 —— 究竟是「该机位探针更严」
还是「其他机位漏测/假绿」，过去靠人眼扫矩阵。本脚本把它变成可复核清单。

两类分歧（严重度不同）：
  * **孤例 PASS（假绿嫌疑，优先查）**：多数机位 FAIL/SPEC，个别机位 PASS
  * **孤例 FAIL（环境/探针嫌疑）**：多数机位 PASS，个别机位 FAIL/SPEC

数据源：`results/Summary/用例矩阵-设计级-总执行结果-<日期>.csv`（各机位列之间为并列关系）。

用法：
  python scripts/cross_client_consistency.py                       # 自动取最新一天
  python scripts/cross_client_consistency.py --date 2026-11-03
  python scripts/cross_client_consistency.py --min-peers 2 --json
  python scripts/cross_client_consistency.py --write               # 落 results/Summary/跨端一致性-<日期>.md

退出码：0 = 分析完成（分歧不是失败）；2 = 数据不可用。
"""

import argparse
import collections
import csv
import glob
import io
import json
import os
import re
import sys

SUMMARY_DIR = os.path.join("results", "Summary")
JUDGED = ("PASS", "FAIL", "SPEC-MISMATCH")        # 可作为"结论"的状态
NON_JUDGED = ("BLOCKED", "NOT_RUN", "", "未回填")


def latest_matrix(summary_dir=SUMMARY_DIR, date=None):
    if date:
        p = os.path.join(summary_dir, "用例矩阵-设计级-总执行结果-%s.csv" % date)
        return p if os.path.exists(p) else None
    files = sorted(glob.glob(os.path.join(summary_dir, "用例矩阵-设计级-总执行结果-*.csv")))
    return files[-1] if files else None


def station_columns(header):
    """返回 (机位列起始索引, 机位名列表)。末尾以「当日」开头的汇总列不计入机位。"""
    end = len(header)
    for i, h in enumerate(header):
        if re.match(r"\s*当日", h or ""):
            end = i
            break
    return 5, [h.strip() for h in header[5:end]]


def client_of(station):
    """`Hermes-1.92.93.23-Linux` → `Hermes`（跨日/跨机位归并按客户端名）。"""
    return (station or "").split("-")[0].strip()


def analyze(header, rows, min_peers=2):
    start, stations = station_columns(header)
    outliers_pass, outliers_fail = [], []
    per_station = collections.defaultdict(lambda: {"judged": 0, "outlier": 0})

    for row in rows:
        if len(row) <= start:
            continue
        states = {}
        for i, st in enumerate(stations):
            idx = start + i
            states[st] = (row[idx] if idx < len(row) else "").strip()
        judged = {st: v for st, v in states.items() if v in JUDGED}
        for st in judged:
            per_station[st]["judged"] += 1
        if len(judged) < min_peers + 1:
            continue
        cnt = collections.Counter(judged.values())
        top, top_n = cnt.most_common(1)[0]
        if top_n < min_peers:
            continue                                    # 无多数派
        outliers = {st: v for st, v in judged.items() if v != top}
        if not outliers:
            continue
        rec = {
            "id": row[1].strip(), "dim": row[2].strip(), "title": row[3].strip(),
            "priority": row[4].strip(), "majority": top,
            "majority_stations": [s for s, v in judged.items() if v == top],
            "outliers": outliers,
            "stations": {st: states[st] for st in stations},
        }
        for st in outliers:
            per_station[st]["outlier"] += 1
        if top in ("FAIL", "SPEC-MISMATCH") and any(v == "PASS" for v in outliers.values()):
            outliers_pass.append(rec)                   # 假绿嫌疑
        elif top == "PASS":
            outliers_fail.append(rec)                   # 孤例失败

    profile = []
    for st, d in per_station.items():
        rate = (d["outlier"] / d["judged"]) if d["judged"] else 0.0
        profile.append({"station": st, "client": client_of(st),
                        "judged": d["judged"], "outlier": d["outlier"], "outlier_rate": round(rate, 3)})
    profile.sort(key=lambda p: (-p["outlier_rate"], -p["outlier"]))
    return {"outlier_pass": outliers_pass, "outlier_fail": outliers_fail, "profile": profile,
            "stations": stations}


def build_report(res, date_str):
    L = ["# 跨端一致性复核（%s）" % date_str, "",
         "> 判定口径：同一条用例各机位结论并列；**孤例 PASS = 假绿嫌疑（优先查）**，孤例 FAIL = 环境/探针嫌疑。",
         "> 数据源：`results/Summary/用例矩阵-设计级-总执行结果-%s.csv`" % date_str, ""]

    L += ["## 一、孤例 PASS（假绿嫌疑，%d 条）" % len(res["outlier_pass"]), ""]
    if res["outlier_pass"]:
        L += ["| 用例 | 维度 | 优先级 | 多数结论 | 孤例机位(PASS) | 标题 |", "| --- | --- | --- | --- | --- | --- |"]
        for r in res["outlier_pass"]:
            L.append("| %s | %s | %s | %s | %s | %s |" % (
                r["id"], r["dim"], r["priority"], r["majority"],
                "、".join(r["outliers"].keys()), r["title"][:40]))
    else:
        L.append("（无）")
    L.append("")

    L += ["## 二、孤例 FAIL（环境/探针嫌疑，%d 条）" % len(res["outlier_fail"]), ""]
    if res["outlier_fail"]:
        L += ["| 用例 | 维度 | 优先级 | 孤例机位(FAIL) | 标题 |", "| --- | --- | --- | --- | --- |"]
        for r in res["outlier_fail"][:60]:
            L.append("| %s | %s | %s | %s | %s |" % (
                r["id"], r["dim"], r["priority"], "、".join(r["outliers"].keys()), r["title"][:40]))
        if len(res["outlier_fail"]) > 60:
            L.append("| … | | | | 共 %d 条（截断） |" % len(res["outlier_fail"]))
    else:
        L.append("（无）")
    L.append("")

    L += ["## 三、机位一致性画像（离群率降序）", "",
          "| 机位 | 客户端 | 参与判定 | 离群 | 离群率 |", "| --- | --- | --- | --- | --- |"]
    for p in res["profile"]:
        L.append("| %s | %s | %d | %d | %.1f%% |" % (p["station"], p["client"], p["judged"], p["outlier"], p["outlier_rate"] * 100))
    return "\n".join(L)


def main() -> int:
    ap = argparse.ArgumentParser(description="跨端一致性复核")
    ap.add_argument("--summary-dir", default=SUMMARY_DIR)
    ap.add_argument("--date", help="YYYY-MM-DD（默认取最新）")
    ap.add_argument("--min-peers", type=int, default=2, help="构成「多数」所需的最少一致机位数（默认 2）")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--write", action="store_true", help="写入 results/Summary/跨端一致性-<日期>.md")
    args = ap.parse_args()

    path = latest_matrix(args.summary_dir, args.date)
    if not path:
        print("找不到矩阵 CSV（dir=%s date=%s）" % (args.summary_dir, args.date or "latest"), file=sys.stderr)
        return 2
    date_str = re.search(r"(\d{4}-\d{2}-\d{2})", os.path.basename(path))
    date_str = date_str.group(1) if date_str else "unknown"

    with io.open(path, "r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    header, body = rows[0], rows[1:]
    res = analyze(header, body, args.min_peers)

    if args.json:
        print(json.dumps({"source": path, "date": date_str,
                          "outlier_pass": len(res["outlier_pass"]), "outlier_fail": len(res["outlier_fail"]),
                          "profile": res["profile"], "detail": res}, ensure_ascii=False, indent=2))
    else:
        print("源：%s（%d 条用例 / %d 个机位）" % (path, len(body), len(res["stations"])))
        print("\n孤例 PASS（假绿嫌疑）：%d 条" % len(res["outlier_pass"]))
        for r in res["outlier_pass"]:
            print("  %-8s %-4s 多数=%-5s 孤例=%s  %s" % (r["id"], r["priority"], r["majority"],
                                                          "、".join(r["outliers"].keys()), r["title"][:34]))
        print("\n孤例 FAIL（环境/探针嫌疑）：%d 条" % len(res["outlier_fail"]))
        for r in res["outlier_fail"][:12]:
            print("  %-8s %-4s 孤例=%s  %s" % (r["id"], r["priority"],
                                              "、".join(r["outliers"].keys()), r["title"][:34]))
        if len(res["outlier_fail"]) > 12:
            print("  …（共 %d 条）" % len(res["outlier_fail"]))
        print("\n机位一致性画像（离群率降序）：")
        for p in res["profile"]:
            print("  %-34s 参与 %3d 离群 %3d  %.1f%%" % (p["station"], p["judged"], p["outlier"], p["outlier_rate"] * 100))

    if args.write:
        out = os.path.join(args.summary_dir, "跨端一致性-%s.md" % date_str)
        with io.open(out, "w", encoding="utf-8") as f:
            f.write(build_report(res, date_str))
        print("\n报告已写入：%s" % out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
