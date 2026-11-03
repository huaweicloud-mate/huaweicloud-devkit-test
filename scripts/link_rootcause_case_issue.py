#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""根因 ↔ 用例 ↔ 单号 三方关联（3-3）。

痛点：汇总的「缺陷根因明细」只列了客户端**报了根因**的项；而「这条 FAIL 到底提没提单、提的哪张单」
散在各客户端执行包的 `HISTORY_LINKS.md` / `FINDINGS.md` 里 —— 过去靠人回查。

**用例全集取自执行结果矩阵（FAIL / SPEC-MISMATCH 行），不是根因明细表** —— 后者会漏掉
「报了失败但没写根因」的用例（实测：流水线点名 6 条未标注用例，全部不在根因表里）。

数据源：
  * 用例全集：`results/Summary/用例矩阵-{设计级,展开级}-总执行结果-<日期>.csv` 中状态为 FAIL / SPEC-MISMATCH 的行
  * 单号：`results/<客户端>/<日期>-*/<OS>/{HISTORY_LINKS.md,FINDINGS.md}`（只认这两个文件，口径对齐 daily_issue_triage）
  * 根因文本：`results/Summary/每日测试汇总-<日期>.md` 的根因明细表（有则附上）

用法：
  python scripts/link_rootcause_case_issue.py                     # 自动取最新一天
  python scripts/link_rootcause_case_issue.py --date 2026-11-03
  python scripts/link_rootcause_case_issue.py --date 2026-11-03 --json
  python scripts/link_rootcause_case_issue.py --date 2026-11-03 --write

退出码：0 = 正常；2 = 数据不可用。
"""

import argparse
import collections
import csv
import glob
import importlib.util
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SUMMARY_DIR = os.path.join(REPO, "results", "Summary")

CASE_RE = re.compile(r"\b(?:D\d+-[A-Za-z0-9-]+|EXP-[A-Za-z0-9-]+)\b")
ITEM_RE = re.compile(r"^(\s*)[-*]\s+.*?\[#(\d{3,6})\]")
BAD_STATUS = ("FAIL", "SPEC-MISMATCH")


def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, "%s.py" % name))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cr = _load("cluster_rootcauses")


# ------------------------- 单号提取 -------------------------

def parse_segment(seg):
    """段内提「关联单」：取最外层列表项 —— 先认 markdown 链接 `[#N](url)`，再退到裸 `#N`。

    更深缩进的行（「历史单内容」摘要里的引用）不计入。
    """
    linked, bare = [], []
    for line in seg.splitlines():
        m = ITEM_RE.match(line)
        if m:
            linked.append((len(m.group(1)), m.group(2)))
            continue
        m2 = re.match(r"^(\s*)[-*]\s+.*?#(\d{3,6})", line)
        if m2:
            bare.append((len(m2.group(1)), m2.group(2)))
    for bucket in (linked, bare):
        if bucket:
            outer = min(i for i, _ in bucket)
            return {n for i, n in bucket if i == outer}
    return set()


def parse_links_file(path):
    """解析 HISTORY_LINKS.md / FINDINGS.md → {case_id: set(issue_numbers)}。"""
    out = collections.defaultdict(set)
    if not os.path.isfile(path):
        return out
    with io.open(path, "r", encoding="utf-8-sig", errors="ignore") as f:
        text = f.read()
    heads = [(m.start(), m.group(1)) for m in re.finditer(r"^#{2,3}\s+(.+)$", text, re.M)]
    for i, (start, head) in enumerate(heads):
        end = heads[i + 1][0] if i + 1 < len(heads) else len(text)
        ids = CASE_RE.findall(head)
        if not ids:
            continue
        out[ids[0]] |= parse_segment(text[start:end])
    return out


def collect_case_issues(results_dir, date):
    """扫某日各客户端执行包 → {case_id: {"issues": set, "clients": set, "sources": set}}。"""
    agg = collections.defaultdict(lambda: {"issues": set(), "clients": set(), "sources": set()})
    pattern = os.path.join(results_dir, "*", "%s-*" % date, "*", "*.md")
    for p in glob.glob(pattern):
        base = os.path.basename(p)
        # 口径对齐 daily_issue_triage：只认这两个文件（不扫「测试报告.md」，它会把未标注冲成 0）
        if base not in ("HISTORY_LINKS.md", "FINDINGS.md"):
            continue
        client = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(p))))
        for cid, issues in parse_links_file(p).items():
            agg[cid]["issues"] |= issues
            agg[cid]["sources"].add(base)
            if issues:
                agg[cid]["clients"].add(client)
    return agg


# ------------------------- 用例全集（矩阵） -------------------------

def load_matrix_cases(summary_dir, date):
    """从执行结果矩阵取 FAIL / SPEC-MISMATCH 用例全集。

    返回 [{case_id, level, dim, title, priority, status}]（设计级 + 展开级）。
    """
    out = []
    for level, fn in (("设计级", "用例矩阵-设计级-总执行结果-%s.csv"),
                      ("展开级", "用例矩阵-展开级-总执行结果-%s.csv")):
        p = os.path.join(summary_dir, fn % date)
        if not os.path.isfile(p):
            continue
        with io.open(p, "r", encoding="utf-8-sig", newline="") as f:
            rows = list(csv.reader(f))
        if not rows:
            continue
        header = [c.strip() for c in rows[0]]
        idx = {name: i for i, name in enumerate(header)}
        i_id = idx.get("ID", 1)
        i_dim = idx.get("维度", 2)
        i_title = idx.get("标题", 3)
        i_pri = idx.get("优先级", 4)
        i_status = next((i for i, h in enumerate(header) if h.startswith("当日")), len(header) - 2)
        for r in rows[1:]:
            if len(r) <= i_status:
                continue
            # 「当日总执行状态」是聚合串（如 `PASS:6 FAIL:3 未回填:2`）—— 取计数 ≥1 的失败态
            raw = r[i_status].strip()
            bad = [s for s in BAD_STATUS if re.search(r"%s\s*:\s*[1-9]" % re.escape(s), raw)]
            if not bad:
                continue
            out.append({"case_id": r[i_id].strip(), "level": level,
                        "dim": (r[i_dim].strip() if i_dim < len(r) else ""),
                        "title": (r[i_title].strip() if i_title < len(r) else ""),
                        "priority": (r[i_pri].strip() if i_pri < len(r) else ""),
                        "status": "+".join(bad)})
    return out


def load_roots(summary_dir, date):
    """根因明细 → {case_id: [ {client, level, root} ]}（可选用，用于补充根因文本）。"""
    p = os.path.join(summary_dir, "每日测试汇总-%s.md" % date)
    idx = collections.defaultdict(list)
    if not os.path.isfile(p):
        return idx
    with io.open(p, "r", encoding="utf-8-sig") as f:
        for r in cr.parse_rootcause_rows(f.read()):
            ids = CASE_RE.findall(r.get("title", "")) or CASE_RE.findall(r.get("root", ""))
            if ids:
                idx[ids[0]].append({"client": r.get("client", ""), "level": r.get("level", ""),
                                    "root": r.get("root", "")})
    return idx


def build_associations(cases, case_map, root_index):
    out = []
    for c in cases:
        cid = c["case_id"]
        info = case_map.get(cid, {"issues": set(), "clients": set(), "sources": set()})
        roots = root_index.get(cid, [])
        out.append({
            "case_id": cid, "level": c["level"], "dim": c["dim"], "title": c["title"],
            "priority": c["priority"], "status": c["status"],
            "issues": sorted(info["issues"], key=int),
            "linked_clients": sorted(info["clients"]),
            "linked_by_any": bool(info["issues"]),
            "rootcause": roots[0]["root"] if roots else "",
            "rootcause_clients": sorted({r["client"] for r in roots}),
        })
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="根因 ↔ 用例 ↔ 单号 三方关联")
    ap.add_argument("--date", help="YYYY-MM-DD（默认取最新）")
    ap.add_argument("--summary-dir", default=SUMMARY_DIR)
    ap.add_argument("--results-dir", default=os.path.join(REPO, "results"))
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--write", action="store_true", help="落 results/Summary/根因单号关联-<日期>.md")
    args = ap.parse_args()

    date_str = args.date
    if not date_str:
        files = sorted(glob.glob(os.path.join(args.summary_dir, "每日测试汇总-*.md")))
        m = re.search(r"(\d{4}-\d{2}-\d{2})", os.path.basename(files[-1])) if files else None
        date_str = m.group(1) if m else None
    if not date_str:
        print("无法确定日期（--date 必填）", file=sys.stderr)
        return 2

    cases = load_matrix_cases(args.summary_dir, date_str)
    if not cases:
        print("没有 FAIL/SPEC-MISMATCH 用例（date=%s）—— 或矩阵 CSV 缺失" % date_str, file=sys.stderr)
        return 2
    case_map = collect_case_issues(args.results_dir, date_str)
    root_index = load_roots(args.summary_dir, date_str)
    links = build_associations(cases, case_map, root_index)

    linked = [l for l in links if l["linked_by_any"]]
    unlinked = [l for l in links if not l["linked_by_any"]]
    all_issues = sorted({n for l in links for n in l["issues"]}, key=int)
    with_root = [l for l in links if l["rootcause"]]

    if args.json:
        print(json.dumps({"date": date_str, "cases": len(links), "linked": len(linked),
                          "unlinked": len(unlinked), "with_rootcause": len(with_root),
                          "issues": all_issues, "detail": links}, ensure_ascii=False, indent=2))
    else:
        print("日期：%s" % date_str)
        print("FAIL/SPEC-MISMATCH 用例 %d 条 → 已关联单号 %d / **未关联 %d**（待查重）；其中 %d 条有根因文本"
              % (len(links), len(linked), len(unlinked), len(with_root)))
        print("涉及上游单号 %d 个\n" % len(all_issues))
        print("== 未关联单号（待查重）==")
        for l in unlinked:
            print("  %-8s %-4s %-4s %-6s 根因:%s" % (l["case_id"], l["priority"], l["dim"],
                                                     l["status"], (l["rootcause"][:34] or "（未记根因）")))
        print("\n== 已关联（用例 → 单号）==")
        for l in linked[:25]:
            print("  %-8s %-4s %s" % (l["case_id"], l["priority"],
                                      "、".join("#" + n for n in l["issues"][:8])))
        if len(linked) > 25:
            print("  …（共 %d 条）" % len(linked))

    if args.write:
        out = os.path.join(args.summary_dir, "根因单号关联-%s.md" % date_str)
        L = ["# 根因 ↔ 用例 ↔ 单号 关联（%s）" % date_str, "",
             "> 用例全集 = 执行结果矩阵中状态为 FAIL / SPEC-MISMATCH 的用例；单号来自各客户端执行包 ",
             "> `HISTORY_LINKS.md` / `FINDINGS.md`（口径对齐 daily_issue_triage 的「客户端未标注单号」）。", "",
             "- FAIL/SPEC 用例 **%d** 条：已关联 **%d** / 未关联 **%d**；有根因文本 **%d** 条"
             % (len(links), len(linked), len(unlinked), len(with_root)),
             "- 涉及上游单号 %d 个：%s" % (len(all_issues), "、".join("#" + n for n in all_issues)), "",
             "## 一、未关联单号（待查重）", "",
             "| 用例 | 优先级 | 维度 | 状态 | 根因（客户端报告） |", "| --- | --- | --- | --- | --- |"]
        for l in unlinked:
            L.append("| %s | %s | %s | %s | %s |" % (l["case_id"], l["priority"], l["dim"], l["status"],
                                                     (l["rootcause"][:70] or "（未记根因）")))
        L += ["", "## 二、已关联", "", "| 用例 | 优先级 | 状态 | 单号 |", "| --- | --- | --- | --- |"]
        for l in linked:
            L.append("| %s | %s | %s | %s |" % (l["case_id"], l["priority"], l["status"],
                                                "、".join("#" + n for n in l["issues"][:12])))
        with io.open(out, "w", encoding="utf-8") as f:
            f.write("\n".join(L))
        print("\n报告已写入：%s" % out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
