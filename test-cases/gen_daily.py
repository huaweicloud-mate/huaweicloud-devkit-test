# -*- coding: utf-8 -*-
"""生成每日执行基础用例（设计级 + 展开级 两份，列与母版完全一致）。

从母版真源派生，输出：
  daily/用例矩阵-设计级.csv  —— 精选设计级用例，列 = 母版设计级完整列（27 列纯设计，无条件裁剪）
  daily/用例矩阵-展开级.csv  —— 精选展开级用例，列 = 母版展开级完整列（24 列纯设计）

母版已是纯设计定义（无执行态），daily 作为「母版精选子集」直接复用母版列结构，
只按精选规则筛行，不再裁剪列 —— 列数、列名、列序与母版逐一对齐，母版演进时自动跟随。

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

# 每日精选排除集（2026-09-15 起）：仅「真·外部依赖」——真云创建-销毁(需保证金/只读子账号)、LLM 行为评测(需真 Agent harness)，
# 每日无法自动化、源码级无法兜底的用例移出 daily，转按需执行。展开级按「源用例 ∈ selected」连带剔除（如 D3-C4→EXP-C4 22 服务）。
# 【撤回标准】凡①探针/脚本已存在可本地跑(如 D6 压测 supplement-probe.mjs)②有历史结论可复用(如 D9-6 clientInfo 互通)
# ③可静态/源码级直调(如 D10-1 描述评审/D10-3 路由 serviceCatalog)——一律保留 daily，不得以「需环境」借口移出。
DAILY_EXCLUDE = {
    "D2-1",      # auth init 三端真云同步（待真云拆分方案）
    "D3-C4",     # 服务创建回归 → 连带 EXP-C4 22 服务（待三档拆分：免费/低频 postPaid/高危计费）
    "D4-13",     # 最小权限凭证通过率（待只读 IAM 子账号）
    "D4-14",     # 操作可审计性（待 CTS 审计日志验证）
    "D10-1", "D10-2", "D10-5",  # LLM 评测 harness（工具描述可选/skill激活率/多轮完成率；D10-3 路由源码级可测、D10-4 P0 安全保留）
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
# 复用母版完整列结构（列数/列名/列序与母版一致）
des_cols = list(des[0].keys())
exp_cols = list(exp[0].keys())

prune_set = set(_PRUNE_EXACT)
for r in des:
    if _in_ranges(r["ID"]):
        prune_set.add(r["ID"])
p0_all = {r["ID"] for r in des if r["优先级"] == "P0"}
selected = (set(prune_set) | set(p0_all) | set(P1_SMOKE)) - DAILY_EXCLUDE

# 设计级：精选 + 母版完整列（一个 ID 一条，去重）
des_keep = []
des_seen = set()
for r in des:
    if r["ID"] in selected and r["ID"] not in des_seen:
        des_seen.add(r["ID"])
        des_keep.append([r[c] for c in des_cols])
with open(DES_OUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(des_cols)
    w.writerows(des_keep)

# 展开级：源用例 ∈ 精选集，保留全部展开行（同源多终端展开不去重）+ 母版完整列
exp_keep = [[r[c] for c in exp_cols] for r in exp if r["源用例"] in selected]
with open(EXP_OUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(exp_cols)
    w.writerows(exp_keep)

print(f"设计级基础用例: {len(des_keep)} 条 / {len(des_cols)} 列 -> {DES_OUT}")
print(f"展开级基础用例: {len(exp_keep)} 条 / {len(exp_cols)} 列 -> {EXP_OUT}")