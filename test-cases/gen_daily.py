# -*- coding: utf-8 -*-
"""生成每日执行基础用例（设计级 + 展开级 两份，只保留用例定义列，不带执行状态/结果）。

从母版真源派生，输出：
  daily/用例矩阵-设计级.csv  —— 精选设计级用例，列 = 母版前 12 个设计字段列
  daily/用例矩阵-展开级.csv  —— 精选展开级用例，列 = 母版前 7 个用例内容列

列裁剪原则：保留「用例定义」列，去掉「执行状态/结果/证据/责任」等执行关联列
  （用例当前状态/设计状态/执行状态/requiredEvidence/blockedReason/owner/依赖/evidencePath
   及 terminal/agent/OS 等环境元数据、status/observedAt 等）。

精选规则（与 daily/README.md 保持一致）：
  设计级 = 禁止剪枝(D4 全量 + D1-1/3/5 + D9 全量 + D10-1~4) + P0 全量 + P1 冒烟(含 D3-C4/D1-58)
  展开级 = 源用例 ∈ 设计级精选集
运行：python test-cases/gen_daily.py
"""
import csv
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DES = os.path.join(REPO, "test-cases", "design", "用例矩阵-设计级.csv")
EXP = os.path.join(REPO, "test-cases", "expanded", "用例矩阵-展开级.csv")
OUT_DIR = os.path.join(REPO, "test-cases", "daily")
DES_OUT = os.path.join(OUT_DIR, "用例矩阵-设计级.csv")
EXP_OUT = os.path.join(OUT_DIR, "用例矩阵-展开级.csv")
os.makedirs(OUT_DIR, exist_ok=True)

# 母版真源前段「用例定义」列（保留）
DESIGN_COLS = ["ID", "维度", "标题", "优先级", "前置条件", "测试数据", "操作步骤",
               "预期结果", "指引来源", "关联工具", "自动化建议", "展开规则"]
EXP_COLS = ["ID", "展开类型", "枚举对象", "源用例", "优先级", "执行要点", "预期结果"]

# 禁止剪枝集（范围 + 精确）
_PRUNE_RANGES = [("D4-", 1, 24), ("D9-", 1, 9)]
_PRUNE_EXACT = {"D1-1", "D1-3", "D1-5", "D10-1", "D10-2", "D10-3", "D10-4"}

# P1 核心冒烟子集（每维度日常可自动化代表；含 D3-C4 服务矩阵、D1-58 白名单）
P1_SMOKE = {
    "D1-2", "D1-4", "D1-6", "D1-26", "D1-27", "D1-28", "D1-30", "D1-31", "D1-33",
    "D1-41", "D1-42", "D1-45", "D1-58",
    "D2-1", "D2-2", "D2-5", "D2-10", "D2-12", "D2-13", "D2-16",
    "D3-A1", "D3-B1", "D3-B3", "D3-B5", "D3-C4", "D3-C5",
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


des = list(csv.DictReader(open(DES, encoding="utf-8-sig")))
exp = list(csv.DictReader(open(EXP, encoding="utf-8-sig")))

prune_set = set(_PRUNE_EXACT)
for r in des:
    if _in_ranges(r["ID"]):
        prune_set.add(r["ID"])
p0_all = {r["ID"] for r in des if r["优先级"] == "P0"}
selected = set(prune_set) | set(p0_all) | set(P1_SMOKE)

# 设计级：精选 + 前 12 用例定义列（一个 ID 一条，去重）
des_keep = []
des_seen = set()
for r in des:
    if r["ID"] in selected and r["ID"] not in des_seen:
        des_seen.add(r["ID"])
        des_keep.append([r[c] for c in DESIGN_COLS])
with open(DES_OUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(DESIGN_COLS)
    w.writerows(des_keep)

# 展开级：源用例 ∈ 精选集，保留全部展开行（同源多终端展开不去重）+ 前 7 用例内容列
exp_keep = [[r[c] for c in EXP_COLS] for r in exp if r["源用例"] in selected]
with open(EXP_OUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(EXP_COLS)
    w.writerows(exp_keep)

print(f"设计级基础用例: {len(des_keep)} 条 -> {DES_OUT}")
print(f"展开级基础用例: {len(exp_keep)} 条 -> {EXP_OUT}")