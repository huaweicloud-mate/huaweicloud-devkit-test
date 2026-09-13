# -*- coding: utf-8 -*-
"""生成每日执行基础用例清单（daily/基础用例清单.csv）。

从母版真源 design/用例矩阵-设计级.csv 按规则派生，不复制真源内容，只输出 ID 清单。
规则（与 daily/README.md 保持一致）：
  1) 禁止剪枝集（不可裁剪）：D4 全量、D1-1/3/5、D9 全量、D10 核心评测(D10-1~4)
  2) P0 全量（安全/中断级，必跑）
  3) P1 核心冒烟（每维度可自动化的日常代表项）
输出 UTF-8-SIG CSV。运行：python test-cases/gen_daily.py
"""
import csv
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DES = os.path.join(REPO, "test-cases", "design", "用例矩阵-设计级.csv")
OUT_DIR = os.path.join(REPO, "test-cases", "daily")
OUT = os.path.join(OUT_DIR, "基础用例清单.csv")
os.makedirs(OUT_DIR, exist_ok=True)

# 禁止剪枝集（范围 + 精确）
_PRUNE_RANGES = [("D4-", 1, 24), ("D9-", 1, 9)]
_PRUNE_EXACT = {"D1-1", "D1-3", "D1-5", "D10-1", "D10-2", "D10-3", "D10-4"}

# P1 核心冒烟子集（每维度日常可自动化代表）
P1_SMOKE = {
    "D1-2", "D1-4", "D1-6", "D1-26", "D1-27", "D1-28", "D1-30", "D1-31", "D1-33",
    "D1-41", "D1-42", "D1-45",
    "D2-1", "D2-2", "D2-5", "D2-10", "D2-12", "D2-13", "D2-16",
    "D3-A1", "D3-B1", "D3-B3", "D3-B5", "D3-C5",
    "D5-1", "D5-3",
    "D6-1", "D6-3", "D6-4",
    "D7-4",
    "D8-1", "D8-4", "D8-6",
    "D10-5",
}


def _in_ranges(rid):
    for pfx, lo, hi in _PRUNE_RANGES:
        if rid.startswith(pfx):
            num = rid[len(pfx):]
            if num.isdigit() and lo <= int(num) <= hi:
                return True
    return False


prune_set = {r for r in _PRUNE_EXACT}
with open(DES, encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))

for r in rows:
    if _in_ranges(r["ID"]):
        prune_set.add(r["ID"])

p0_all = {r["ID"] for r in rows if r["优先级"] == "P0"}

selected = set(prune_set) | set(p0_all) | set(P1_SMOKE)

HEADERS = ["ID", "维度", "标题", "优先级", "门禁", "当前执行状态"]

def gate(rid):
    if rid in prune_set:
        return "禁止剪枝"
    if rid in p0_all:
        return "P0必跑"
    if rid in P1_SMOKE:
        return "P1冒烟"
    return ""

by_id = {r["ID"]: r for r in rows}
out_rows = []
for rid in sorted(selected, key=lambda x: (x.split("-")[0], x)):
    r = by_id[rid]
    out_rows.append([rid, r["维度"], r["标题"], r["优先级"], gate(rid), r["执行状态"]])

with open(OUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(HEADERS)
    w.writerows(out_rows)

from collections import Counter
g = Counter(x[4] for x in out_rows)
print(f"基础用例清单: {len(out_rows)} 条 -> {OUT}")
print(f"门禁分布: {dict(g)}")