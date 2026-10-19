#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""D11-40 体验度量对照 · 多采样聚合（取中位后判定）

背景：`eval/harness/ux-agent-loop.mjs` 采集的三指标（steps/tokens/fails/clarifications）
单次采样时常有 |Δ|≤1 的噪声，不足以支撑「不劣化 + 至少一项改善」的判定；
本模块把同一 SUT 内「基线版 ↔ 新版」的多轮采样聚合为中位值再判定。

输入：`<dir>/ux-loop-<版本标签>-r<轮次>.json`（ux-agent-loop.mjs --json 产出）
输出：控制台表格 + `<dir>/ux-loop-3samples-medians.json`

用法:
    python scripts/ux_aggregate_3samples.py --dir eval/results
    python scripts/ux_aggregate_3samples.py --dir <dir> --baseline 1.1.8-next.3 --current 1.1.8
"""
import argparse
import glob
import json
import os
import re
import statistics
import sys

# 四个采集指标；HARD = 不允许劣化的项（tokens 属成本，改善计分但不作硬性要求）
METRIC_KEYS = ("steps", "tokens", "fails", "clarifications")
HARD_KEYS = ("steps", "fails", "clarifications")
RUN_RE = re.compile(r"ux-loop-(.+)-r(\d+)\.json$")
BETTER, SAME, WORSE = "改善", "持平", "劣化"


def load_runs(directory):
    """扫描 <dir>/ux-loop-<版本>-r<轮次>.json -> {版本: {轮次: summary}}"""
    runs = {}
    for path in sorted(glob.glob(os.path.join(directory, "ux-loop-*-r*.json"))):
        m = RUN_RE.search(os.path.basename(path))
        if not m:
            continue
        with open(path, encoding="utf-8") as fh:
            summary = json.load(fh)["summary"]
        runs.setdefault(m.group(1), {})[int(m.group(2))] = summary
    return runs


def medians(runs, version):
    return {k: statistics.median(runs[version][r][k] for r in runs[version]) for k in METRIC_KEYS}


def judge(base_med, cur_med):
    """-> (逐项判定, 总判定)；口径：HARD 项均不劣化 且 至少一项严格改善。"""
    verdicts = {k: (BETTER if cur_med[k] < base_med[k] else SAME if cur_med[k] == base_med[k] else WORSE)
                for k in METRIC_KEYS}
    met = all(verdicts[k] != WORSE for k in HARD_KEYS) and any(v == BETTER for v in verdicts.values())
    return verdicts, ("MET" if met else "NOT_MET")


def _pick_versions(runs, baseline, current):
    by_size = sorted(runs, key=lambda v: -len(runs[v]))
    base = baseline or by_size[0]
    cur = current or next((v for v in by_size if v != base), None)
    return base, cur


def main(argv=None):
    ap = argparse.ArgumentParser(description="聚合 D11-40 多采样并判定")
    ap.add_argument("--dir", default=os.path.join("eval", "results"))
    ap.add_argument("--baseline", help="基线版标签（默认取轮次最多的版本）")
    ap.add_argument("--current", help="新版标签")
    args = ap.parse_args(argv)

    runs = load_runs(args.dir)
    if len(runs) < 2:
        print(f"需要至少 2 个版本的采样文件，实际 {len(runs)}: {sorted(runs)}", file=sys.stderr)
        return 2
    base, cur = _pick_versions(runs, args.baseline, args.current)

    print("### 逐轮原始值\n")
    print("| 轮次 | 版本 | " + " | ".join(METRIC_KEYS) + " | 用例数 |")
    print("|---|---|" + "---|" * (len(METRIC_KEYS) + 1))
    for rnd in sorted({r for v in runs for r in runs[v]}):
        for ver in (base, cur):
            s = runs.get(ver, {}).get(rnd)
            if s:
                print(f"| r{rnd} | {ver} | " + " | ".join(str(s[k]) for k in METRIC_KEYS)
                      + f" | {s.get('cases', '-')} |")

    base_med, cur_med = medians(runs, base), medians(runs, cur)
    verdicts, verdict = judge(base_med, cur_med)

    print(f"\n### 多采样中位（{len(runs[base])} vs {len(runs[cur])} 轮）\n")
    print(f"| 指标 | {base}(中位) | {cur}(中位) | Δ(cur−base) | 判定 |")
    print("|---|---|---|---|---|")
    for k in METRIC_KEYS:
        print(f"| {k} | {base_med[k]:g} | {cur_med[k]:g} | {cur_med[k] - base_med[k]:+g} | {verdicts[k]} |")

    worse = [k for k in METRIC_KEYS if verdicts[k] == WORSE]
    print(f"\n判定: {verdict}（{'/'.join(HARD_KEYS)} 均不劣化={all(verdicts[k] != WORSE for k in HARD_KEYS)}，"
          f"至少一项改善={any(v == BETTER for v in verdicts.values())}）")
    print("退化项:", worse or "无")
    print("口径: 仅同 SUT 相对对照，不作绝对判定；|Δ|≤1 属噪声带，须以采样数而非单轮为准。")

    out = os.path.join(args.dir, "ux-loop-3samples-medians.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump({"baseline": base, "current": cur,
                   "samples": {base: len(runs[base]), cur: len(runs[cur])},
                   "medians": {base: base_med, cur: cur_med},
                   "verdicts": verdicts, "verdict": verdict}, fh, ensure_ascii=False, indent=2)
    print(f"\n(中位与判定已写出: {out})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
