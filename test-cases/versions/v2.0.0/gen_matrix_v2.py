# -*- coding: utf-8 -*-
"""gen_matrix_v2.py — v2（2.0.0）契约迁移独立生成器（方案 B：母版零触碰）

用途：v2 未发 npm，母版 test-cases/design/ 仍按 v1 契约被 11 个客户端每日执行。
本生成器从「候选矩阵（76 条迁移后）+ 母版（212 设计级 + 137 展开级）」合成
**完整 v2 契约用例集**，输出到 test-cases/versions/v2.0.0/（独立目录，不污染母版），
供 `python scripts/init_day.py <客户端> <OS> --version v2.0.0` 执行 v2 版本全量测试。

真源（三件，均只读）：
  1. reviews/ITER-006-20261029171721/hermes/candidate-matrix.csv  # 76 条迁移后 27 列全文
  2. test-cases/design/用例矩阵-设计级.csv                         # 母版 212 设计级（136 原样源）
  3. test-cases/expanded/用例矩阵-展开级.csv                       # 母版 137 展开级（68 原样 + 69 迁移源）

输出（两件，覆盖写）：
  test-cases/versions/v2.0.0/用例矩阵-设计级-v2.0.0.csv   # 212 = 76 迁移 + 136 原样
  test-cases/versions/v2.0.0/用例矩阵-展开级-v2.0.0.csv   # 137 = 47 迁移 + 90 原样

确定性：无时间戳/随机量注入，同输入同输出（字节级可复现）。
"""
import csv
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))          # test-cases/versions/v2.0.0/
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # 测试仓根

CAND = os.path.join(REPO, "reviews", "ITER-006-20261029171721", "hermes", "candidate-matrix.csv")
DESIGN_MASTER = os.path.join(REPO, "test-cases", "design", "用例矩阵-设计级.csv")
EXPANDED_MASTER = os.path.join(REPO, "test-cases", "expanded", "用例矩阵-展开级.csv")

OUT_DESIGN = os.path.join(HERE, "用例矩阵-设计级-v2.0.0.csv")
OUT_EXPANDED = os.path.join(HERE, "用例矩阵-展开级-v2.0.0.csv")

# ---- 迁移类别（与 candidate-matrix 76 条分组一致） ----
VENDOR_GATE = "vendor_gate"
TOOLCOUNT = "toolcount"
DISPATCH = "dispatch"
REMOTE = "remote"
RULE = "rule"
FAKE_MOVE = "fake-move"

# 最终 76 条 ID → 类别（评审放行口径，硬编码进生成器保证确定性）
FINAL_CLASS = {
    # vendor_gate 64 条
    "D2-1": VENDOR_GATE, "D2-2": VENDOR_GATE, "D2-4": VENDOR_GATE, "D2-5": VENDOR_GATE,
    "D2-7": VENDOR_GATE, "D2-8": VENDOR_GATE, "D2-9": VENDOR_GATE, "D2-10": VENDOR_GATE,
    "D2-11": VENDOR_GATE, "D2-12": VENDOR_GATE, "D2-13": VENDOR_GATE, "D2-14": VENDOR_GATE,
    "D2-15": VENDOR_GATE, "D2-16": VENDOR_GATE, "D2-18": VENDOR_GATE, "D2-19": VENDOR_GATE,
    "D2-20": VENDOR_GATE, "D2-21": VENDOR_GATE, "D2-22": VENDOR_GATE, "D2-25": VENDOR_GATE,
    "D3-A3": VENDOR_GATE, "D3-A4": VENDOR_GATE, "D3-A5": VENDOR_GATE,
    "D3-B1": VENDOR_GATE, "D3-B2": VENDOR_GATE, "D3-B3": VENDOR_GATE, "D3-B7": VENDOR_GATE,
    "D3-B8": VENDOR_GATE,
    "D3-C1": VENDOR_GATE, "D3-C3": VENDOR_GATE, "D3-C4": VENDOR_GATE, "D3-C5": VENDOR_GATE,
    "D3-C7": VENDOR_GATE, "D3-C8": VENDOR_GATE, "D3-C9": VENDOR_GATE, "D3-C11": VENDOR_GATE,
    "D3-C14": VENDOR_GATE,
    "D3-S1": VENDOR_GATE, "D3-S2": VENDOR_GATE, "D3-S3": VENDOR_GATE, "D3-S4": VENDOR_GATE,
    "D3-S5": VENDOR_GATE, "D3-S6": VENDOR_GATE, "D3-S7": VENDOR_GATE, "D3-S8": VENDOR_GATE,
    "D4-4": VENDOR_GATE, "D4-5": VENDOR_GATE, "D4-13": VENDOR_GATE, "D4-14": VENDOR_GATE,
    "D4-18": VENDOR_GATE, "D4-20": VENDOR_GATE, "D4-24": VENDOR_GATE, "D4-27": VENDOR_GATE,
    "D5-5": VENDOR_GATE, "D5-8": VENDOR_GATE,
    "D6-2": VENDOR_GATE, "D6-6": VENDOR_GATE, "D6-8": VENDOR_GATE,
    "D8-3": VENDOR_GATE,
    "D10-3": VENDOR_GATE,
    "D1-71": VENDOR_GATE, "D1-72": VENDOR_GATE, "D1-74": VENDOR_GATE, "D1-68": VENDOR_GATE,
    # dispatch 3 条
    "D1-36": DISPATCH, "D1-45": DISPATCH, "D9-12": DISPATCH,
    # remote 1 条
    "D9-10": REMOTE,
    # fake-move 3 条
    "D1-65": FAKE_MOVE, "D1-66": FAKE_MOVE, "D9-11": FAKE_MOVE,
    # rule 1 条
    "D10-4": RULE,
    # toolcount 4 条
    "D9-1": TOOLCOUNT, "D5-1": TOOLCOUNT, "D1-56": TOOLCOUNT, "D5-3": TOOLCOUNT,
}

assert len(FINAL_CLASS) == 76, f"FINAL_CLASS 应为 76 条，实为 {len(FINAL_CLASS)}"

# ---- 展开级迁移规则 ----
# gate 前置句（与 candidate-matrix 设计级措辞一致）
GATE_STEP_PREFIX = "⓪建立 vendor 确认：带 vendorConfirmed（用户确立华为云的原文引用）调用；首次触发 vendor challenge 后原样 retry 一次放行 "
GATE_EXPECT_PREFIX = "（gate 放行后）"

# gate 实质承载的展开类型（这些展开类型在展开级文本里直接写了 serviceCatalog/plan 断言）
GATE_CARRY_EXPAND_TYPES = {"D10评测集", "D3-C4服务矩阵"}


def _read(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def _write(path, rows, fieldnames):
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def build_design():
    """设计级 212 = 76 迁移（取 candidate-matrix 整行）+ 136 原样（取母版整行）。"""
    cand = _read(CAND)
    master = _read(DESIGN_MASTER)
    candmap = {r["ID"]: r for r in cand}
    fieldnames = list(master[0].keys())

    merged = []
    replaced = 0
    for r in master:
        if r["ID"] in candmap:
            merged.append(candmap[r["ID"]])
            replaced += 1
        else:
            merged.append(r)

    assert replaced == 76, f"设计级应替换 76 条，实为 {replaced}"
    assert len(merged) == 212, f"设计级应 212 条，实为 {len(merged)}"
    _write(OUT_DESIGN, merged, fieldnames)
    return len(merged)


def build_expanded():
    """展开级 137 = 47 迁移 + 90 原样。

    迁移规则（按 designCaseId 的类别 + 展开类型判定实质承载 vs 指针）：
      - vendor_gate 且 展开类型 ∈ GATE_CARRY_EXPAND_TYPES → 执行要点加 gate 前置句、预期加「（gate 放行后）」
      - toolcount 且 文本含「40 工具」→ 40→56（源 D5-3 的 10 客户端展开）
      - 其余（gate 指针 D5-5 / toolcount 无数字 D5-1 / dispatch 指针 D1-45）→ 原样不动
    """
    exp = _read(EXPANDED_MASTER)
    fieldnames = list(exp[0].keys())
    migrated = 0

    out = []
    for r in exp:
        grp = FINAL_CLASS.get(r["designCaseId"])
        if grp is None:
            out.append(r)
            continue

        new = dict(r)
        if grp == VENDOR_GATE and r.get("展开类型") in GATE_CARRY_EXPAND_TYPES:
            new["执行要点"] = GATE_STEP_PREFIX + (r["执行要点"] or "")
            new["预期结果"] = GATE_EXPECT_PREFIX + (r["预期结果"] or "")
            migrated += 1
        elif grp == TOOLCOUNT and ("40 工具" in (r["执行要点"] or "") + (r["预期结果"] or "")):
            new["执行要点"] = (r["执行要点"] or "").replace("40 工具", "56 工具")
            new["预期结果"] = (r["预期结果"] or "").replace("40 工具", "56 工具")
            migrated += 1
        # 其余：指针型，原样
        out.append(new)

    assert migrated == 47, f"展开级应迁移 47 行，实为 {migrated}"
    assert len(out) == 137, f"展开级应 137 条，实为 {len(out)}"
    _write(OUT_EXPANDED, out, fieldnames)
    return len(out)


if __name__ == "__main__":
    d = build_design()
    e = build_expanded()
    print(f"gen_matrix_v2: 设计级 {d} 条（76 迁移 + 136 原样），展开级 {e} 条（47 迁移 + 90 原样）")