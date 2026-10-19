#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""D11-40 体验度量对照 · 多采样聚合（取中位后判定）

背景：`eval/harness/ux-agent-loop.mjs` 采集的三指标（steps/tokens/fails/clarifications）
在单次采样下 |Δ| 常落在 ±1 的噪声带内，不足以支撑「不劣化 + 至少一项改善」的判定。
本脚本把同一 SUT 内「基线版 ↔ 新版」的多轮采样聚合为中位值再判定。

输入：`<dir>/ux-loop-<版本标签>-r<轮次>.json`（由 ux-agent-loop.mjs --json 产出）。
输出：控制台表格 + `<dir>/ux-loop-3samples-medians.json`。

用法:
    python scripts/ux-aggregate-3samples.py --dir eval/results
    python scripts/ux-aggregate-3samples.py --dir <dir> --baseline 1.1.8-next.3 --current 1.1.8
"""
import argparse
import glob
import json
import os
import re
import statistics as st
import sys

KEYS = ["steps", "tokens", "fails", "clarifications"]
# 判定：这三项不允许劣化（tokens 属成本，改善计分但不作硬性不劣化项之外的门槛）
HARD = ["steps", "fails", "clarifications"]


def load_runs(directory):
    """-> {version: {round: summary}}"""
    runs = {}
    for path in sorted(glob.glob(os.path.join(directory, "ux-loop-*-r*.json"))):
        m = re.search(r"ux-loop-(.+)-r(\d+)\.json$", os.path.basename(path))
        if not m:
            continue
        ver, rnd = m.group(1), int(m.group(2))
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        runs.setdefault(ver, {})[rnd] = data["summary"]
    return runs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=os.path.join("eval", "results"))
    ap.add_argument("--baseline", help="基线版标签（默认取轮次最多的第一个版本）")
    ap.add_argument("--current", help="新版标签")
    args = ap.parse_args()

    if not os.path.isdir(args.dir):
        print(f"目录不存在: {args.dir}", file=sys.stderr)
        return 2
    runs = load_runs(args.dir)
    if len(runs) < 2:
        print(f"需要至少 2 个版本的采样文件，实际 {len(runs)}: {list(runs)}", file=sys.stderr)
        return 2

    vers = sorted(runs, key=lambda v: -len(runs[v]))
    base, cur = args.baseline or vers[0], args.current or \
        next((v for v in vers if v != (args.baseline or vers[0])), vers[1])

    print("### 逐轮原始值\n")
    print("| 轮次 | 版本 | " + " | ".join(KEYS) + " | 用例数 |")
    print("|---|---|" + "---|" * (len(KEYS) + 1))
    for rnd in sorted({r for v in runs for r in runs[v]}):
        for ver in (base, cur):
            s = runs.get(ver, {}).get(rnd)
            if s:
                print(f"| r{rnd} | {ver} | " + " | ".join(str(s[k]) for k in KEYS)
                      + f" | {s.get('cases', '-')} |")

    med = {v: {k: st.median(runs[v][r][k] for r in runs[v]) for k in KEYS} for v in (base, cur)}
    print(f"\n### 多采样中位（{len(runs[base])} vs {len(runs[cur])} 轮）\n")
    print(f"| 指标 | {base}(中位) | {cur}(中位) | Δ(cur−base) | 判定 |")
    print("|---|---|---|---|---|")
    verdicts = {}
    for k in KEYS:
        d = med[cur][k] - med[base][k]
        verdicts[k] = "改善" if d < 0 else ("持平" if d == 0 else "劣化")
        print(f"| {k} | {med[base][k]:g} | {med[cur][k]:g} | {d:+g} | {verdicts[k]} |")

    no_worse = all(verdicts[k] != "劣化" for k in HARD)
    any_better = any(verdicts[k] == "改善" for k in KEYS)
    print(f"\n判定: {'MET' if (no_worse and any_better) else 'NOT_MET'}"
          f"（{'/'.join(HARD)} 均不劣化={no_worse}，至少一项改善={any_better}）")
    print("退化项:", [k for k in KEYS if verdicts[k] == "劣化"] or "无")
    print("口径: 仅同 SUT 相对对照，不作绝对判定；|Δ|≤1 属噪声带，须以采样数而非单轮为准。")

    out = os.path.join(args.dir, "ux-loop-3samples-medians.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump({"baseline": base, "current": cur, "samples": {base: len(runs[base]), cur: len(runs[cur])},
                   "medians": med, "verdicts": verdicts,
                   "verdict": "MET" if (no_worse and any_better) else "NOT_MET"}, fh,
                  ensure_ascii=False, indent=2)
    print(f"\n(中位与判定已写出: {out})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
