#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""运维视角聚合：把当天**可离线计算**的运维分析合成一节，供每日汇总报告内嵌。

设计原则：
  * **离线可算优先**：只接不依赖外部服务（multica / 华为云凭证）的分析，保证 CI 可跑。
  * **有则加，无则说明**：某项不可用（缺数据 / 缺工具）时给出原因，而不是静默消失。
  * **失败不阻断**：任何异常都被吞掉并记一行说明 —— 日报主报告绝不能被它拖垮。
  * **控篇幅**：每节只给摘要 + Top N（默认 5）；明细留在各自的独立产物与脚本里。

覆盖：① 根因簇 ② 跨端一致性 ③ 单号关联 ④ 自主产物（autocases/candidates）⑤ 失败签名（仅本机，需 multica）

用法：
  python scripts/ops_insights.py
  python scripts/ops_insights.py --date 2026-11-03 --top 8
  python scripts/ops_insights.py --date 2026-11-03 --out results/Summary/运维视角-2026-11-03.md
"""

import argparse
import collections
import csv
import glob
import importlib.util
import io
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SUMMARY_DIR = os.path.join(REPO, "results", "Summary")


def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, "%s.py" % name))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _try(fn, fallback=""):
    try:
        return fn()
    except Exception as e:  # noqa: BLE001 —— 任何失败都降级为说明文字，不阻断日报
        return fallback or "不可用（%s: %s）" % (type(e).__name__, str(e)[:80])


# --------------------------- 各节 ---------------------------

def rootcause_section(date, top_n):
    """① 根因簇：同一根因被 N 个客户端各记一遍 → 合并。"""
    cr = _load("cluster_rootcauses")
    path = os.path.join(SUMMARY_DIR, "每日测试汇总-%s.md" % date)
    if not os.path.isfile(path):
        return ["（跳过）未找到 %s" % os.path.basename(path)]
    with io.open(path, "r", encoding="utf-8-sig") as f:
        rows = cr.parse_rootcause_rows(f.read())
    if not rows:
        return ["（无根因记录）"]
    clusters = cr.build_clusters(rows)
    cross = [c for c in clusters if c["client_count"] >= 2]
    out = ["根因记录 **%d** 条 → 聚成 **%d** 簇，其中跨客户端簇 **%d** 个（跨端复现度即真实影响面）。"
           % (len(rows), len(clusters), len(cross)), ""]
    out.append("| 根因簇 | 记录 | 客户端 | 代表用例 |")
    out.append("| --- | --- | --- | --- |")
    for c in clusters[:top_n]:
        cases = "、".join(c["cases"][:5]) or "—"
        out.append("| %s | %d | %d | %s |" % (c["label"], c["count"], c["client_count"], cases))
    if len(clusters) > top_n:
        out.append("| … | | | 共 %d 簇，完整清单见 `npm run clusters` |" % len(clusters))
    return out


def consistency_section(date, top_n):
    """② 跨端一致性：同一用例各机位结论分歧（孤例 PASS = 假绿嫌疑）。"""
    cc = _load("cross_client_consistency")
    path = cc.latest_matrix(SUMMARY_DIR, date)
    if not path:
        return ["（跳过）未找到 %s 的用例矩阵 CSV" % date]
    with io.open(path, "r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    res = cc.analyze(rows[0], rows[1:])
    op, of = res["outlier_pass"], res["outlier_fail"]
    out = ["**孤例 PASS（假绿嫌疑）%d 条** / 孤例 FAIL（环境/探针嫌疑）%d 条 —— 孤例 PASS 优先复核（多数机位判失败而个别判通过）。"
           % (len(op), len(of)), ""]
    if op:
        out.append("| 用例 | 优先级 | 多数结论 | 判 PASS 的孤例机位 |")
        out.append("| --- | --- | --- | --- |")
        for r in op[:top_n]:
            out.append("| %s | %s | %s | %s |" % (r["id"], r["priority"], r["majority"],
                                                  "、".join(list(r["outliers"].keys())[:3])))
        if len(op) > top_n:
            out.append("| … | | | 共 %d 条，完整清单见 `npm run consistency` |" % len(op))
    else:
        out.append("（无孤例 PASS）")
    return out


def link_section(date, top_n):
    """③ 单号关联：FAIL/SPEC 用例 × 执行包单号 → 待查重清单。"""
    lk = _load("link_rootcause_case_issue")
    cases = lk.load_matrix_cases(SUMMARY_DIR, date)
    if not cases:
        return ["（跳过）%s 无 FAIL/SPEC-MISMATCH 用例或矩阵缺失" % date]
    case_map = lk.collect_case_issues(os.path.join(REPO, "results"), date)
    links = lk.build_associations(cases, case_map, {})
    unlinked = [l for l in links if not l["linked_by_any"]]
    out = ["FAIL/SPEC 用例 **%d** 条：已关联单号 **%d** / **未关联 %d**（待查重，口径对齐 `daily_issue_triage`）。"
           % (len(links), len(links) - len(unlinked), len(unlinked)), ""]
    if unlinked:
        cap = max(top_n, 5)
        out.append("| 未关联用例 | 优先级 | 状态 |")
        out.append("| --- | --- | --- |")
        for l in unlinked[:cap]:
            out.append("| %s | %s | %s |" % (l["case_id"], l["priority"], l["status"]))
        if len(unlinked) > cap:
            out.append("| … | | 共 %d 条，完整清单见 `npm run links` |" % len(unlinked))
    return out


def artifacts_section(date, top_n):
    """④ 自主产物：使命自展用例（autocases）与候选用例（candidates）。"""
    out = []
    ac = glob.glob(os.path.join(REPO, "results", "*", "%s-*" % date, "*", "autocases", "*.csv"))
    total_cases = 0
    for p in ac:
        try:
            with io.open(p, "r", encoding="utf-8-sig", newline="") as f:
                total_cases += max(0, len(list(csv.reader(f))) - 1)
        except Exception:  # noqa: BLE001
            continue
    out.append("- 使命自主展开产物：**%d** 个执行包含 `autocases/`，共 **%d** 条自主用例（口径独立，不计入母版通过率）"
               % (len(ac), total_cases))
    cand = glob.glob(os.path.join(REPO, "test-cases", "design", "candidates", "候选用例-*.csv"))
    out.append("- 候选用例骨架：**%d** 个文件（`test-cases/design/candidates/`，须走评审才可固化入母版）" % len(cand))
    return out


def signature_section(top_n):
    """⑤ 失败签名分布（**仅本机**：需 multica CLI；CI 环境自动跳过）。"""
    if not shutil.which("multica"):
        return ["（跳过）本机无 multica CLI —— 失败签名分布只在维护者本机可算"]
    cf = _load("classify_failure")
    targets = cf.list_autopilots("每日测试")
    counter = collections.Counter()
    for t in targets:
        for r in cf.fetch_runs(t["id"], 2):
            rec = cf.classify_run(r)
            counter[rec["signature"] or "NORMAL"] += 1
    if not counter:
        return ["（无运行记录）"]
    out = ["扫描「每日测试-*」机队最近 2 次运行（共 %d 次）：" % sum(counter.values()), ""]
    out.append("| 签名 | 次数 | 处置分支 |")
    out.append("| --- | --- | --- |")
    for sig, n in counter.most_common(top_n):
        act = cf.SIG_ACTION.get(sig, "—")
        out.append("| %s | %d | %s |" % (sig, n, act))
    return out


SECTIONS = [
    ("根因簇（跨端复现）", rootcause_section),
    ("跨端一致性", consistency_section),
    ("单号关联（待查重）", link_section),
    ("自主产物", artifacts_section),
]


def build_md(date, top_n=5, include_signature=True):
    """返回「运维视角」markdown 片段（失败一律降级为说明，不抛）。"""
    head = ["", "## 运维视角（自动生成）", "",
            "> 本节由 `scripts/ops_insights.py` 聚合，**离线可算**部分随每日汇总自动生成；明细见各独立产物与 `npm run <子命令>`。", ""]
    lines = list(head)
    for title, fn in SECTIONS:
        lines.append("### %s" % title)
        lines.append("")
        try:
            lines.extend(fn(date, top_n))
        except Exception as e:  # noqa: BLE001
            lines.append("（生成失败：%s: %s）" % (type(e).__name__, str(e)[:80]))
        lines.append("")
    if include_signature:
        lines.append("### 失败签名分布（仅维护者本机）")
        lines.append("")
        try:
            lines.extend(signature_section(top_n))
        except Exception as e:  # noqa: BLE001
            lines.append("（生成失败：%s: %s）" % (type(e).__name__, str(e)[:80]))
        lines.append("")
    return "\n".join(lines)


def build_html(date, top_n=5, include_signature=True):
    """HTML 版：把 md 片段包成简单表格/列表（不引外部资源）。"""
    md = build_md(date, top_n, include_signature)
    out = ['<section style="margin-top:28px;border-top:2px solid #2c3e50;padding-top:14px;">',
           '<h2 style="color:#2c3e50;">运维视角（自动生成）</h2>',
           '<p style="color:#7f8c8d;font-size:12px;">由 scripts/ops_insights.py 聚合；明细见各独立产物与 npm run 子命令。</p>']
    for ln in md.splitlines():
        s = ln.strip()
        if not s or s.startswith(">"):
            continue
        if s.startswith("## "):
            continue
        if s.startswith("### "):
            out.append('<h3 style="color:#2c3e50;font-size:14px;margin:16px 0 6px;">%s</h3>' % _esc(s[4:]))
        elif s.startswith("| "):
            cells = [c.strip() for c in s.strip("|").split("|")]
            if set("".join(cells)) <= set("-: "):
                continue
            tag = "th" if out and out[-1].startswith("<table") and "th" not in out[-1] else "td"
            out.append("<tr>" + "".join("<%s>%s</%s>" % (tag, _esc(c), tag) for c in cells) + "</tr>")
        elif s.startswith("- "):
            out.append('<div style="font-size:12px;margin:3px 0;">· %s</div>' % _esc(s[2:]))
        else:
            out.append('<p style="font-size:12px;margin:4px 0;">%s</p>' % _esc(s))
    out.append("</section>")
    return "\n".join(out)


def _esc(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace("**", "").replace("`", ""))


def main() -> int:
    ap = argparse.ArgumentParser(description="运维视角聚合（供每日汇总内嵌）")
    ap.add_argument("--date", default=None, help="YYYY-MM-DD（默认今天）")
    ap.add_argument("--top", type=int, default=5, help="每节 Top N（默认 5）")
    ap.add_argument("--no-signature", action="store_true", help="跳过失败签名（需 multica）")
    ap.add_argument("--out", help="写入文件（缺省只打印）")
    ap.add_argument("--html", action="store_true", help="输出 HTML 片段")
    args = ap.parse_args()

    date = args.date or __import__("datetime").datetime.now().strftime("%Y-%m-%d")
    text = (build_html(date, args.top, not args.no_signature) if args.html
            else build_md(date, args.top, not args.no_signature))
    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with io.open(args.out, "w", encoding="utf-8") as f:
            f.write(text if text.endswith("\n") else text + "\n")
        print("已写入：%s" % args.out)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
