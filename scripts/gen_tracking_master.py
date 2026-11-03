#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""执行追踪母版生成器：把「用例定义（§2.5 字段）」与「执行状态」合成可筛选的 Excel 母版。

补齐 docs/03-执行准备清单.md 组 5 明确登记为**待建**的产物：
    「执行追踪母版（§5.1 载体）：Excel/腾讯文档，列=§2.5 字段 + 状态（未执行/通过/失败/阻塞/跳过）+ 优先级过滤」
    —— 全仓此前只有 CSV 矩阵，没有这份交付给测试经理的追踪母版。

数据源（都是既有真源，本脚本不臆造）：
  * 用例定义：test-cases/design|expanded|ux/用例矩阵-*.csv
  * 执行状态：results/Summary/用例矩阵-{设计级,展开级}-总执行结果-<日期>.csv（各客户端列）
  * 展开级预筛：展开级 CSV 的 agent/OS 列（AGENTS.md 约定：非本端/非本 OS 不下发，不计未执行）

输出：test-cases/执行追踪母版-<日期>.xlsx
  Sheet：设计级 / 展开级 / 体验级 / 图例（状态枚举 + 口径说明）
  每表：表头冻结 + 自动筛选（优先级、状态、维度可筛）+ 状态底色

用法：
    uv run --with openpyxl python scripts/gen_tracking_master.py
    python scripts/gen_tracking_master.py --date 2026-11-03 --out test-cases
"""

import argparse
import csv
import datetime
import glob
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(HERE)
sys.path.insert(0, HERE)

from trend_metrics import machine_cols, _cell_status  # noqa: E402

# 状态枚举（docs/01-测试规划.md:433 定义：未执行/通过/失败/阻塞/跳过）
# 另加 "未纳入当日范围"：不在当日矩阵中的用例（≠ 未执行 —— AGENTS.md 约定 NOT_RUN 仅指「归你但明确没跑」）
STATUS_CN = {
    "PASS": "通过",
    "FAIL": "失败",
    "BLOCKED": "阻塞",
    "NOT_RUN": "未执行",
    "SPEC-MISMATCH": "跳过（规格不一致）",
    "NOT_IN_SCOPE": "未纳入当日范围",
}
FILL = {
    "PASS": "E8F6EF", "FAIL": "FDECEA", "BLOCKED": "FEF5E7",
    "NOT_RUN": "F2F3F4", "SPEC-MISMATCH": "F4ECF7", "NOT_IN_SCOPE": "FAFAFA",
}
SPECS = [
    ("设计级", os.path.join(REPO, "test-cases", "design", "用例矩阵-设计级.csv"),
     "用例矩阵-设计级-总执行结果", "设计级"),
    ("展开级", os.path.join(REPO, "test-cases", "expanded", "用例矩阵-展开级.csv"),
     "用例矩阵-展开级-总执行结果", "展开级"),
    ("体验级", os.path.join(REPO, "test-cases", "ux", "用例矩阵-体验级.csv"),
     None, "体验级"),
]


def _read_csv(path):
    with io.open(path, "r", encoding="utf-8-sig", newline="") as f:
        return list(csv.reader(f))


def load_status(date=None):
    """最新（或指定日期）矩阵 → {用例ID: {状态聚合}}。"""
    out = {}
    for name, _csv_path, matrix_prefix, _lv in SPECS:
        if not matrix_prefix:
            continue
        files = sorted(glob.glob(os.path.join(REPO, "results", "Summary", matrix_prefix + "-*.csv")))
        if not files:
            continue
        if date:
            files = [f for f in files if date in os.path.basename(f)] or files
        rows = _read_csv(files[-1])
        if not rows:
            continue
        hdr, body = rows[0], rows[1:]
        idx = {n: i for i, n in enumerate(hdr)}
        cols = machine_cols(hdr)
        for r in body:
            if len(r) < len(hdr):
                r = r + [""] * (len(hdr) - len(r))
            cid = (r[idx.get("ID", 1)] if "ID" in idx else "").strip()
            if not cid:
                continue
            counts = {}
            for raw, _client, _m in cols:
                s = _cell_status(r[idx[raw]])
                if s:
                    counts[s] = counts.get(s, 0) + 1
            done = counts.get("PASS", 0) + counts.get("FAIL", 0) + counts.get("SPEC-MISMATCH", 0)
            if counts.get("FAIL"):
                verdict = "FAIL"
            elif counts.get("SPEC-MISMATCH"):
                verdict = "SPEC-MISMATCH"
            elif counts.get("PASS"):
                verdict = "PASS"
            elif counts.get("BLOCKED"):
                verdict = "BLOCKED"
            elif counts.get("NOT_RUN"):
                verdict = "NOT_RUN"
            else:
                verdict = "NOT_RUN"
            out[cid] = {
                "verdict": verdict,
                "pass": counts.get("PASS", 0), "fail": counts.get("FAIL", 0),
                "blocked": counts.get("BLOCKED", 0), "notrun": counts.get("NOT_RUN", 0),
                "spec": counts.get("SPEC-MISMATCH", 0), "done": done,
                "machines": len(cols), "source": os.path.basename(files[-1]),
            }
    return out


def build_rows(level, csv_path, status):
    """用例定义 + 状态 → 二维表（表头 + 行）。"""
    data = _read_csv(csv_path)
    if not data:
        return [], []
    hdr, body = data[0], data[1:]
    idx = {n: i for i, n in enumerate(hdr)}
    if level == "展开级":
        base = ["ID", "展开类型", "枚举对象", "源用例", "优先级", "执行要点", "预期结果", "requiredEvidence"]
    else:
        base = ["ID", "维度", "标题", "优先级", "前置条件", "测试数据", "操作步骤", "预期结果",
                "指引来源", "关联工具", "自动化建议"]
    extra = {"设计级": ["展开规则"], "展开级": ["terminalType", "terminal", "agent", "OS"], "体验级": ["展开规则"]}[level]
    out_hdr = base + extra + ["状态", "通过端数", "失败端数", "阻塞端数", "未执行端数", "已执行/总端数", "状态来源"]
    out = []
    for r in body:
        if not r or not (r[0] or "").strip():
            continue
        def g(k):
            i = idx.get(k)
            return (r[i] if i is not None and i < len(r) else "").strip()
        cid = g("ID")
        st = status.get(cid, {})
        # 不在当日矩阵中 → "未纳入当日范围"（不是"未执行"：后者专指归你但明确没跑）
        verdict = st.get("verdict", "NOT_RUN") if st else "NOT_IN_SCOPE"
        row = [g(k) for k in base] + [g(k) for k in extra] + [
            STATUS_CN.get(verdict, verdict),
            st.get("pass", 0), st.get("fail", 0), st.get("blocked", 0), st.get("notrun", 0),
            "%d/%d" % (st.get("done", 0), st.get("machines", 0)),
            st.get("source", "—"),
        ]
        out.append((verdict, row))
    return out_hdr, out


def write_workbook(path, sheets, date_label):
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Alignment, Font, PatternFill
    except ImportError:
        return False
    wb = Workbook()
    wb.remove(wb.active)
    head_fill = PatternFill("solid", fgColor="EEF2F6")
    for name, hdr, rows in sheets:
        ws = wb.create_sheet(name)
        ws.append(hdr)
        for c in ws[1]:
            c.font = Font(bold=True)
            c.fill = head_fill
            c.alignment = Alignment(vertical="center", wrap_text=True)
        for _verdict, row in rows:
            ws.append(row)
        # 状态列着色
        try:
            si = hdr.index("状态") + 1
        except ValueError:
            si = None
        if si:
            for i in range(2, ws.max_row + 1):
                cell = ws.cell(row=i, column=si)
                v = str(cell.value or "")
                for key, cn in STATUS_CN.items():
                    if v == cn:
                        cell.fill = PatternFill("solid", fgColor=FILL[key])
                        break
        ws.freeze_panes = "A2"
        if ws.max_row > 1:
            ws.auto_filter.ref = "A1:%s%d" % (ws.cell(row=1, column=ws.max_column).coordinate.rstrip("1"), ws.max_row)
        # 列宽：定义类列给宽一点
        for j, h in enumerate(hdr, start=1):
            w = 34 if h in ("标题", "操作步骤", "预期结果", "执行要点", "前置条件", "测试数据", "展开规则") else 14
            ws.column_dimensions[ws.cell(row=1, column=j).column_letter].width = w
    # 图例
    ws = wb.create_sheet("图例")
    ws.append(["状态", "含义", "判定口径"])
    for k, v in STATUS_CN.items():
        ws.append([v, k, "该用例在各客户端列的聚合结论（有 FAIL 取 FAIL；无 FAIL 有 SPEC 取 SPEC；其次 PASS/BLOCKED/NOT_RUN）"])
    ws.append(["", "", ""])
    ws.append(["数据日期", date_label, ""])
    ws.append(["口径说明", "状态取自 results/Summary/ 当日汇总矩阵的各客户端列；未执行 = 在矩阵内但该端 NOT_RUN/空",
               "母版只做「执行追踪」，不改写用例定义（定义真源在 test-cases/*/用例矩阵-*.csv）"])
    ws.append(["未纳入当日范围", "该用例不在当日汇总矩阵中（当日未下发到该层级）",
               "≠「未执行」：AGENTS.md 约定 NOT_RUN 仅指「归你但你明确没跑」"])
    ws.append(["展开级预筛", "展开级按 agent/OS 预筛后下发（AGENTS.md 约定）",
               "非本客户端/非本 OS 的展开级不计未执行"])
    for c in ws[1]:
        c.font = Font(bold=True)
        c.fill = PatternFill("solid", fgColor="EEF2F6")
    ws.column_dimensions["A"].width = 22
    ws.column_dimensions["B"].width = 60
    ws.column_dimensions["C"].width = 70
    wb.save(path)
    return True


def main():
    ap = argparse.ArgumentParser(description="生成执行追踪母版（Excel）")
    ap.add_argument("--date", default=None, help="状态快照日期 YYYY-MM-DD（默认取最新矩阵）")
    ap.add_argument("--out", default=os.path.join(REPO, "test-cases"), help="输出目录")
    args = ap.parse_args()

    date_label = args.date
    if not date_label:
        files = sorted(glob.glob(os.path.join(REPO, "results", "Summary", "用例矩阵-设计级-总执行结果-*.csv")))
        m = re.search(r"(\d{4}-\d{2}-\d{2})\.csv$", files[-1]) if files else None
        date_label = m.group(1) if m else datetime.datetime.now().strftime("%Y-%m-%d")

    status = load_status(args.date)
    sheets, total = [], 0
    for level, csv_path, _p, _lv in SPECS:
        if not os.path.isfile(csv_path):
            print("[跳过] 缺用例定义：%s" % csv_path)
            continue
        hdr, rows = build_rows(level, csv_path, status)
        sheets.append((level, hdr, rows))
        matched = sum(1 for _v, r in rows if r[hdr.index("状态来源")] != "—")
        total += len(rows)
        print("%s：定义 %d 条（其中 %d 条有状态快照）" % (level, len(rows), matched))

    if not sheets:
        print("[BLOCKED] 无用例定义可合成")
        return 2

    os.makedirs(args.out, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    path = os.path.join(args.out, "执行追踪母版-%s-%s.xlsx" % (date_label, stamp))
    if not write_workbook(path, sheets, date_label):
        print("[跳过] 未安装 openpyxl —— 用 `uv run --with openpyxl python scripts/gen_tracking_master.py`")
        return 0
    print("执行追踪母版: %s（共 %d 条用例 / %d 个 sheet）" % (path, total, len(sheets) + 1))

    # 只保留最新（被 WPS/Excel 锁住则跳过）
    old = sorted(glob.glob(os.path.join(args.out, "执行追踪母版-*.xlsx")))[:-1]
    for f in old:
        try:
            os.remove(f)
            print("清理旧母版：%s" % os.path.basename(f))
        except OSError:
            print("⚠ 跳过被占用（可能正被 WPS/Excel 打开）：%s" % os.path.basename(f))
    return 0


if __name__ == "__main__":
    sys.exit(main())
