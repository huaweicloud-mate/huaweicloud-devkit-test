#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""候选用例生成（2-2）：读源码版本变更 → 命中模块 → 维度 → 生成候选用例骨架。

定位：把「看 git diff 想该补哪些用例」从人脑变成**半自动** —— 脚本出**候选骨架**（带变更依据），
补判据/落母版仍须走评审流程（`HERMES_DRAFT_READY` → `skills/case-design`）。

纪律（铁律）：
  * 产物**只落** `test-cases/design/candidates/`，**绝不写母版**（母版由 gen_matrix.py 生成 + verify_new.py 门禁）。
  * 候选 ID 用 `CAND-` 前缀，与母版 `D*` / 展开级 `EXP-*` 空间隔离。
  * 每条候选都挂「生成依据 = 变更文件」，可追证。

数据源：
  * 变更文件：`git -C <hdk> diff --name-only <range>`（默认 `origin/main..HEAD`），或 `--files` 直接给。
  * 模块↔维度映射：`test-manager/module-map.mjs` 的 MODULE_DIMENSIONS（正则解析，解析为 0 条即报错）。

用法：
  python scripts/gen_candidate_cases.py --diff origin/main..HEAD
  python scripts/gen_candidate_cases.py --files a/safety-policy.mjs b/tools.mjs
  python scripts/gen_candidate_cases.py --diff HEAD~10..HEAD --out test-cases/design/candidates
  python scripts/gen_candidate_cases.py --files x/tools.mjs --json

退出码：0 = 正常（含无变更）；2 = module-map 解析失败 / 输入不可用。
"""

import argparse
import csv
import io
import json
import os
import re
import subprocess
import sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
MODULE_MAP = os.path.join(REPO, "test-manager", "module-map.mjs")
DESIGN_CSV = os.path.join(REPO, "test-cases", "design", "用例矩阵-设计级.csv")

RISK_PRIORITY = {"high": "P0", "medium": "P1", "low": "P2"}
COLS = ["candidate_id", "维度", "风险", "标题", "优先级", "变更命中模块",
        "关联工具", "生成依据", "建议步骤", "建议判据", "状态"]


def parse_module_map(path=MODULE_MAP):
    """解析 module-map.mjs 的 MODULE_DIMENSIONS（不依赖 node）。解析为 0 条 → 报错。"""
    if not os.path.isfile(path):
        raise SystemExit("找不到 module-map：%s" % path)
    with io.open(path, "r", encoding="utf-8-sig") as f:
        text = f.read()
    entries = []
    pat = re.compile(
        r"\{\s*dim:\s*'([^']+)',\s*risk:\s*'([^']+)',\s*modules:\s*\[([^\]]*)\],\s*cases:\s*\[([^\]]*)\]"
        r"(?:,\s*note:\s*'([^']*)')?",
        re.S)
    for m in pat.finditer(text):
        dim, risk = m.group(1), m.group(2)
        modules = re.findall(r"'([^']+)'", m.group(3))
        cases = re.findall(r"'([^']+)'", m.group(4))
        entries.append({"dim": dim, "risk": risk, "modules": modules, "cases": cases,
                        "note": m.group(5) or ""})
    if not entries:
        raise SystemExit("module-map 解析为 0 条：格式可能已变（检查 MODULE_DIMENSIONS 结构）")
    return entries


def changed_files(repo, rng):
    """git diff --name-only <range>。返回文件路径列表（失败返回 None）。"""
    try:
        p = subprocess.run(["git", "-C", repo, "diff", "--name-only", rng],
                           capture_output=True, timeout=60)
    except Exception:
        return None
    if p.returncode != 0:
        return None
    return [l.strip() for l in (p.stdout or b"").decode("utf-8", "ignore").splitlines() if l.strip()]


def match_dimensions(files, entries):
    """变更文件 → 命中的 (维度条目, [命中文件]) 列表。按 basename 去扩展名做子串匹配。"""
    hits = []
    for e in entries:
        matched = []
        for f in files:
            base = os.path.basename(f)
            stem = re.sub(r"\.[A-Za-z0-9]+$", "", base)
            for mod in e["modules"]:
                if mod and (mod == stem or mod in f.replace("\\", "/")):
                    matched.append(f)
                    break
        if matched:
            hits.append((e, sorted(set(matched))))
    return hits


def build_candidates(files, entries):
    """生成候选用例骨架。返回 [dict]。"""
    out = []
    for e, matched in match_dimensions(files, entries):
        dim = e["dim"]
        for i, f in enumerate(matched, 1):
            stem = re.sub(r"\.[A-Za-z0-9]+$", "", os.path.basename(f))
            out.append({
                "candidate_id": "CAND-%s-%d" % (dim, i),
                "维度": dim,
                "风险": e["risk"],
                "标题": "%s 变更回归：%s%s" % (dim, stem, ("（%s）" % e["note"]) if e.get("note") else ""),
                "优先级": RISK_PRIORITY.get(e["risk"], "P2"),
                "变更命中模块": stem,
                "关联工具": "",
                "生成依据": f,
                "建议步骤": "（待补）对 %s 的变更行为做正反双向验证" % stem,
                "建议判据": "（待补）命中时返回 X，不命中时必须返回 Y；禁止自证式判据",
                "状态": "候选",
            })
    return out


def norm_dim(s):
    """维度键归一化：母版 CSV 的「维度」列形如 `D4安全`，候选/映射用 `D4` —— 统一取前缀 D<数字>。"""
    m = re.match(r"\s*(D\d+)", str(s or ""))
    return m.group(1) if m else str(s or "").strip()


def existing_coverage(design_csv=DESIGN_CSV):
    """返回母版各维度的用例数（键归一化为 D1..D10，用于提示既有覆盖）。"""
    if not os.path.isfile(design_csv):
        return {}
    with io.open(design_csv, "r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    cov = {}
    for r in rows:
        dim = norm_dim(r.get("维度"))
        if dim:
            cov[dim] = cov.get(dim, 0) + 1
    return cov


def main() -> int:
    ap = argparse.ArgumentParser(description="候选用例生成（读变更 → 命中维度 → 候选骨架）")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--diff", help="git diff 范围，如 origin/main..HEAD")
    src.add_argument("--files", nargs="+", help="直接给变更文件列表")
    ap.add_argument("--repo", default=os.path.join(os.path.dirname(REPO), "hdk"), help="源码仓库路径（默认 ../hdk）")
    ap.add_argument("--out", default=os.path.join(REPO, "test-cases", "design", "candidates"),
                    help="候选产物目录（默认 test-cases/design/candidates）")
    ap.add_argument("--no-write", action="store_true", help="只打印不写文件")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    entries = parse_module_map()
    if args.files:
        files = args.files
    else:
        files = changed_files(args.repo, args.diff)
        if files is None:
            print("无法取得 diff（--repo %s / range %s）；可用 --files 直接给变更文件。" % (args.repo, args.diff),
                  file=sys.stderr)
            return 2

    # 只关心源码类变更
    files = [f for f in files if re.search(r"\.(mjs|ts|js|json|py)$", f)]

    cands = build_candidates(files, entries)
    cov = existing_coverage()

    if args.json:
        print(json.dumps({"changed_files": files, "candidates": cands,
                          "dimensions_hit": sorted({c["维度"] for c in cands}),
                          "existing_coverage": cov}, ensure_ascii=False, indent=2))
    else:
        print("变更文件 %d 个 → 命中维度 %s" % (len(files), sorted({c["维度"] for c in cands}) or "无"))
        for c in cands:
            print("  [%s] %-6s %-4s %s  ← %s（母版该维度已有 %d 条）"
                  % (c["candidate_id"], c["维度"], c["优先级"], c["标题"][:48],
                     c["变更命中模块"], cov.get(c["维度"], 0)))
        if not cands:
            print("  无命中：本次变更未落在 module-map 的模块面上。")

    if not args.no_write and cands:
        os.makedirs(args.out, exist_ok=True)
        date_str = datetime.now().strftime("%Y%m%d")
        path = os.path.join(args.out, "候选用例-%s.csv" % date_str)
        with io.open(path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=COLS)
            w.writeheader()
            for c in cands:
                w.writerow(c)
        print("\n候选已写入：%s（%d 条）" % (path, len(cands)))
        print("注意：候选**不是**母版用例 —— 补完判据后须走评审（HERMES_DRAFT_READY → 用例规范）方可固化。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
