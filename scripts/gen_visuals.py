#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""可视化产物统一生成器：测试全景图（HTML + xlsx）与静态素材图（SVG）。

补两类欠缺（见 docs/测试体系全貌与测试策略.md §尚未兑现的缺口）：
  ① 全景图覆盖不足且不自动更新 —— 改为**确定性生成**，数据源全部取自自动更新的产物
     （metrics/execution.csv 迭代台账 + metrics/trend.csv 每日趋势 + results/Summary/ 用例矩阵）
  ② assets/ 可视化素材未落地 —— 生成金字塔图 / 缺口热力图 / 框架总览图

设计纪律：
  * **纯 stdlib**（SVG/HTML）；xlsx 需 openpyxl —— 缺失时**只跳 xlsx 并提示**，其余照常产出。
  * **只保留最新 + 跳过被锁**：同名前缀旧产物清理时，删除失败（WPS/Excel 锁文件）跳过并提示，不中断。
  * 数据缺失一律降级为"（跳过）原因"，不臆造数字。

用法：
    python scripts/gen_visuals.py
    python scripts/gen_visuals.py --out . --keep 1
    uv run --with openpyxl python scripts/gen_visuals.py     # 需要 xlsx 时
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

PREFIX = "huaweicloud-devkit-测试总览-"
# 注意：前缀刻意区别于 "huaweicloud-devkit-测试全景图-"（那份是 feishu-sync 维护的
# 11-sheet 全景图母版快照，绝不能被本脚本的 prune 清理掉）。


def _read_csv(path):
    with io.open(path, "r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def _dim_key(s):
    m = re.search(r"(D\d+)", s or "")
    return m.group(1) if m else (s or "").strip()


# --------------------------- 数据加载 ---------------------------

def load_iter_ledger():
    """迭代台账（metrics/execution.csv）→ 按 iteration 聚合。"""
    path = os.path.join(REPO, "metrics", "execution.csv")
    if not os.path.isfile(path):
        return []
    agg = {}
    for r in _read_csv(path):
        it = (r.get("iteration") or "").strip()
        if not it:
            continue
        d = agg.setdefault(it, {"iteration": it, "date": (r.get("date") or "").strip(),
                                "planned": 0, "executed": 0, "passed": 0, "failed": 0, "blocked": 0,
                                "scopes": 0})
        for k in ("planned", "executed", "passed", "failed"):
            try:
                d[k] += int(float(r.get(k) or 0))
            except ValueError:
                pass
        d["scopes"] += 1
    return sorted(agg.values(), key=lambda x: (x["date"], x["iteration"]))


def load_trend():
    path = os.path.join(REPO, "metrics", "trend.csv")
    return _read_csv(path) if os.path.isfile(path) else []


def load_latest_matrix():
    """最新一份设计级矩阵 → (date, header, rows)。"""
    files = sorted(glob.glob(os.path.join(REPO, "results", "Summary", "用例矩阵-设计级-总执行结果-*.csv")))
    if not files:
        return None, [], []
    path = files[-1]
    m = re.search(r"(\d{4}-\d{2}-\d{2})\.csv$", path)
    with io.open(path, "r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    hdr = rows[0] if rows else []
    return (m.group(1) if m else "?"), hdr, rows[1:]


def heat_dim_client(hdr, rows):
    """维度 × 机位 → {dim: {client: {PASS: n, FAIL: n, ..., total: n}}}"""
    cols = machine_cols(hdr)
    idx = {name: i for i, name in enumerate(hdr)}   # 列名 → 下标（不能用 c[0]，那是首字符）
    out = {}
    for r in rows:
        if len(r) < len(hdr):
            r = r + [""] * (len(hdr) - len(r))
        dim = _dim_key(r[idx.get("维度", 2)] if "维度" in idx else "")
        if not dim:
            continue
        for raw, client, _m in cols:
            s = _cell_status(r[idx[raw]])
            if not s:
                continue
            cell = out.setdefault(dim, {}).setdefault(client, {"PASS": 0, "FAIL": 0,
                                                              "BLOCKED": 0, "SPEC-MISMATCH": 0, "total": 0})
            cell[s] = cell.get(s, 0) + 1
            cell["total"] += 1
    return out


def client_packages():
    """各客户端执行包数（results/<客户端>/<日期>-<IP>/...）。"""
    out = {}
    base = os.path.join(REPO, "results")
    for name in sorted(os.listdir(base)) if os.path.isdir(base) else []:
        if name in ("Summary", "history", "version", "SandboxMonitor", "UX专项", "CodeArtsSpace"):
            continue
        p = os.path.join(base, name)
        if not os.path.isdir(p):
            continue
        n = len([d for d in os.listdir(p) if re.match(r"\d{4}-\d{2}-\d{2}-", d)])
        if n:
            out[name] = n
    return out


# --------------------------- SVG 素材 ---------------------------

def svg_pyramid(rows_note, node_tests, py_tests, case_lib):
    """测试金字塔（左宽右窄三层）。"""
    layers = [
        ("E2E / 真云验证", "%d 条设计级用例（真云创建-销毁归零）" % case_lib, "#c0392b", 260, 60, 90),
        ("集成 / 契约", "%d 条展开级用例 + MCP/CLI 契约单测" % case_lib, "#d68910", 200, 110, 150),
        ("单元 / 自动化", "node %d + python %d 例（CI 硬门禁）" % (node_tests, py_tests), "#27ae60", 140, 160, 210),
    ]
    h = 300
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="640" height="%d" viewBox="0 0 640 %d">' % (h, h),
             '<rect width="640" height="%d" fill="#ffffff"/>' % h,
             '<text x="24" y="34" font-family="Microsoft YaHei,sans-serif" font-size="18" font-weight="bold" fill="#2c3e50">测试资产金字塔</text>',
             '<text x="24" y="56" font-family="Microsoft YaHei,sans-serif" font-size="11" fill="#7f8c8d">%s</text>' % rows_note]
    y = 80
    for name, sub, color, w, x0, _pad in layers:
        parts.append('<polygon points="%d,%d %d,%d %d,%d %d,%d" fill="%s" opacity="0.92"/>'
                     % (x0, y, x0 + w, y, x0 + w - 30, y + 56, x0 + 30, y + 56, color))
        parts.append('<text x="%d" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">%s</text>'
                     % (x0 + w // 2, y + 30, name))
        parts.append('<text x="%d" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="10" fill="#ffffff" opacity="0.9" text-anchor="middle">%s</text>'
                     % (x0 + w // 2, y + 47, sub))
        y += 66
    parts.append('<text x="24" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="10" fill="#95a5a6">由 scripts/gen_visuals.py 生成（数据源：CI 硬门禁用例数 + 用例矩阵母版）</text>' % (h - 12))
    parts.append("</svg>")
    return "\n".join(parts)


def svg_heatmap(heat, dims, clients, date):
    """维度 × 客户端 缺口热力图（颜色 = 通过率；灰 = 未覆盖）。"""
    cw, ch, x0, y0 = 62, 30, 96, 76
    w = x0 + cw * max(1, len(clients)) + 24
    h = y0 + ch * max(1, len(dims)) + 52
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">' % (w, h, w, h),
             '<rect width="%d" height="%d" fill="#ffffff"/>' % (w, h),
             '<text x="24" y="30" font-family="Microsoft YaHei,sans-serif" font-size="16" font-weight="bold" fill="#2c3e50">覆盖缺口热力图（维度 × 客户端）</text>',
             '<text x="24" y="50" font-family="Microsoft YaHei,sans-serif" font-size="11" fill="#7f8c8d">数据 %s · 颜色=通过率（红→黄→绿），灰=该端未覆盖</text>' % date]
    for j, c in enumerate(clients):
        parts.append('<text x="%d" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="9" fill="#34495e" text-anchor="start" transform="rotate(-45 %d %d)">%s</text>'
                     % (x0 + j * cw + 6, y0 - 6, x0 + j * cw + 6, y0 - 6, c[:12]))
    for i, d in enumerate(dims):
        yy = y0 + i * ch
        parts.append('<text x="88" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="10" fill="#34495e" text-anchor="end">%s</text>' % (yy + 19, d))
        for j, c in enumerate(clients):
            xx = x0 + j * cw
            cell = heat.get(d, {}).get(c)
            if not cell or not cell["total"]:
                color, label = "#ecf0f1", ""
            else:
                done = cell["PASS"] + cell["FAIL"] + cell["SPEC-MISMATCH"]
                rate = (cell["PASS"] / done) if done else 0
                color = "#27ae60" if rate >= 0.95 else ("#f4d03f" if rate >= 0.8 else "#e67e22" if rate >= 0.5 else "#c0392b")
                label = "%d%%" % round(rate * 100)
            parts.append('<rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="#ffffff" stroke-width="1.5"/>'
                         % (xx, yy, cw - 2, ch - 2, color))
            if label:
                parts.append('<text x="%d" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="9" fill="#ffffff" text-anchor="middle">%s</text>'
                             % (xx + (cw - 2) // 2, yy + 19, label))
    parts.append("</svg>")
    return "\n".join(parts)


def svg_framework(date, tools):
    """框架总览图：三层编排 + 工具链。"""
    w, h = 900, 420
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">' % (w, h, w, h),
             '<rect width="%d" height="%d" fill="#ffffff"/>' % (w, h),
             '<text x="24" y="32" font-family="Microsoft YaHei,sans-serif" font-size="17" font-weight="bold" fill="#2c3e50">AI Native 测试编排框架</text>',
             '<text x="24" y="52" font-family="Microsoft YaHei,sans-serif" font-size="11" fill="#7f8c8d">数据 %s · 三层生成模型：策略 → 使命 → 执行证据</text>' % date]
    layers = [
        ("Layer 1 · Manager 决策", "#2c3e50", "变更 → 影响域（module-map / LLM 双路）→ 风险 → 策略", ["tm-plan.mjs", "module-map.mjs", "tm-impact-llm.mjs"]),
        ("Layer 2 · 使命调度", "#8e44ad", "策略 → 使命（维度 × 客户端 × 用例）→ 机群广播", ["mission-expand", "run-plan.mjs", "mcp-server.mjs(7 工具)"]),
        ("Layer 3 · 执行与证据", "#16a085", "客户端自主执行 → 结果回填 → 证据融合", ["results/Summary/", "eval/replay/", "ops_insights.py"]),
    ]
    y = 76
    for title, color, desc, chips in layers:
        parts.append('<rect x="24" y="%d" width="852" height="86" rx="8" fill="%s" opacity="0.08" stroke="%s" stroke-width="1.5"/>' % (y, color, color))
        parts.append('<text x="44" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="14" font-weight="bold" fill="%s">%s</text>' % (y + 26, color, title))
        parts.append('<text x="44" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="11" fill="#34495e">%s</text>' % (y + 48, desc))
        for k, chip in enumerate(chips):
            cx = 44 + k * 230
            parts.append('<rect x="%d" y="%d" width="214" height="22" rx="11" fill="#ffffff" stroke="%s" stroke-width="1"/>' % (cx, y + 58, color))
            parts.append('<text x="%d" y="%d" font-family="Consolas,monospace" font-size="10" fill="#34495e">%s</text>' % (cx + 10, y + 73, chip))
        y += 100
    parts.append('<text x="24" y="%d" font-family="Microsoft YaHei,sans-serif" font-size="10" fill="#95a5a6">工具链：%s</text>' % (h - 14, " · ".join(tools)))
    parts.append("</svg>")
    return "\n".join(parts)


# --------------------------- HTML / xlsx ---------------------------

def render_html(date, iters, trend, heat, packs, latest_date):
    dims = sorted(heat.keys(), key=lambda s: (int(re.sub(r"\D", "", s) or 0), s))
    clients = sorted({c for d in heat.values() for c in d})
    css = """body{font-family:'Microsoft YaHei',Arial,sans-serif;margin:0;padding:28px;color:#2c3e50;background:#f7f9fb}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:26px 0 10px;border-left:4px solid #2c3e50;padding-left:10px}
table{border-collapse:collapse;width:100%;background:#fff;font-size:12px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
th,td{border:1px solid #e6eaee;padding:6px 8px;text-align:left}th{background:#eef2f6;font-weight:600}
td.n{text-align:right}.meta{color:#7f8c8d;font-size:12px;margin-bottom:8px}
.pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;background:#eef2f6}"""
    h = ['<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">',
         '<title>huaweicloud-devkit 测试全景图</title>',
         '<style>%s</style></head><body>' % css,
         '<h1>huaweicloud-devkit 测试全景图</h1>',
         '<div class="meta">数据快照 %s · 由 <code>scripts/gen_visuals.py</code> 确定性生成（迭代台账 + 每日趋势 + 用例矩阵）</div>' % date,
         '<span class="pill">迭代 %d 轮</span> <span class="pill">每日流水线 %d 天</span> <span class="pill">覆盖 %d 维度 × %d 客户端</span> '
         % (len(iters), len(trend), len(dims), len(clients))]

    h.append("<h2>一、迭代总览（ITER 台账）</h2><table><tr><th>迭代</th><th>日期</th><th>批次</th><th>计划</th><th>已执行</th><th>通过</th><th>失败</th></tr>")
    for it in iters:
        h.append("<tr><td>%s</td><td>%s</td><td class='n'>%d</td><td class='n'>%d</td><td class='n'>%d</td><td class='n'>%d</td><td class='n'>%d</td></tr>"
                 % (it["iteration"], it["date"], it["scopes"], it["planned"], it["executed"], it["passed"], it["failed"]))
    h.append("</table>")

    h.append("<h2>二、每日测试流水线（最近 10 天）</h2><table><tr><th>日期</th><th>用例</th><th>单元格</th><th>已执行</th><th>PASS</th><th>FAIL</th><th>SPEC</th><th>BLOCKED</th><th>NOT RUN</th><th>执行率</th><th>通过率</th></tr>")
    for r in trend[-10:]:
        h.append("<tr><td>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s%%</td><td class='n'>%s%%</td></tr>"
                 % (r.get("date"), r.get("total"), r.get("cells"), r.get("done"), r.get("pass"), r.get("fail"),
                    r.get("spec"), r.get("blocked"), r.get("notrun"), r.get("exec_rate"), r.get("pass_rate")))
    h.append("</table>")

    h.append("<h2>三、维度覆盖（最新矩阵 %s）</h2><table><tr><th>维度</th><th>已覆盖客户端</th><th>PASS</th><th>FAIL</th><th>BLOCKED</th><th>SPEC</th><th>通过率</th></tr>" % latest_date)
    for d in dims:
        cell = heat[d]
        agg = {"PASS": 0, "FAIL": 0, "BLOCKED": 0, "SPEC-MISMATCH": 0}
        for c in cell.values():
            for k in agg:
                agg[k] += c.get(k, 0)
        done = agg["PASS"] + agg["FAIL"] + agg["SPEC-MISMATCH"]
        rate = "%d%%" % round(agg["PASS"] / done * 100) if done else "—"
        h.append("<tr><td>%s</td><td class='n'>%d</td><td class='n'>%d</td><td class='n'>%d</td><td class='n'>%d</td><td class='n'>%d</td><td class='n'>%s</td></tr>"
                 % (d, len(cell), agg["PASS"], agg["FAIL"], agg["BLOCKED"], agg["SPEC-MISMATCH"], rate))
    h.append("</table>")

    h.append("<h2>四、客户端执行包分布</h2><table><tr><th>客户端</th><th>执行包</th></tr>")
    for k, v in sorted(packs.items(), key=lambda x: -x[1]):
        h.append("<tr><td>%s</td><td class='n'>%d</td></tr>" % (k, v))
    h.append("</table>")

    h.append('<p class="meta">口径：用例=纯设计定义（母版不做执行态）；执行结果以 results/Summary/ 为准；'
             '本页为总览索引，明细见各客户端执行包与每日汇总报告。</p></body></html>')
    return "\n".join(h)


def write_xlsx(path, iters, trend, heat, packs):
    """多 sheet xlsx（需 openpyxl）。返回 True/False。"""
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill
    except ImportError:
        return False
    wb = Workbook()
    ws = wb.active
    ws.title = "迭代总览"
    ws.append(["迭代", "日期", "批次", "计划", "已执行", "通过", "失败"])
    for it in iters:
        ws.append([it["iteration"], it["date"], it["scopes"], it["planned"], it["executed"], it["passed"], it["failed"]])
    ws2 = wb.create_sheet("每日流水线")
    ws2.append(["日期", "用例", "单元格", "已执行", "PASS", "FAIL", "SPEC", "BLOCKED", "NOT RUN", "执行率", "通过率"])
    for r in trend:
        ws2.append([r.get("date"), r.get("total"), r.get("cells"), r.get("done"), r.get("pass"),
                    r.get("fail"), r.get("spec"), r.get("blocked"), r.get("notrun"),
                    r.get("exec_rate"), r.get("pass_rate")])
    dims = sorted(heat.keys(), key=lambda s: (int(re.sub(r"\D", "", s) or 0), s))
    clients = sorted({c for d in heat.values() for c in d})
    ws3 = wb.create_sheet("维度×客户端通过率")
    ws3.append(["维度"] + clients)
    for d in dims:
        row = [d]
        for c in clients:
            cell = heat.get(d, {}).get(c)
            if not cell or not cell["total"]:
                row.append("")
            else:
                done = cell["PASS"] + cell["FAIL"] + cell["SPEC-MISMATCH"]
                row.append(round(cell["PASS"] / done * 100) if done else 0)
        ws3.append(row)
    ws4 = wb.create_sheet("客户端执行包")
    ws4.append(["客户端", "执行包"])
    for k, v in sorted(packs.items(), key=lambda x: -x[1]):
        ws4.append([k, v])
    for sheet in wb.worksheets:
        for c in sheet[1]:
            c.font = Font(bold=True)
            c.fill = PatternFill("solid", fgColor="EEF2F6")
        sheet.freeze_panes = "A2"
    wb.save(path)
    return True


# --------------------------- 清理（只保留最新 + 跳过被锁） ---------------------------

def prune(dirpath, prefix, keep, exts):
    """同前缀旧产物清理：**按时间戳分组**保留最新 keep 组（同组各扩展名一起留）。

    为什么按组而非按文件：HTML 与 XLSX 是同一份快照的配对产物，按文件数保留会把配对拆散
    （曾出现"保留 xlsx、删掉 html"）。删除失败（被 WPS/Excel 占用）跳过并提示。
    """
    groups = {}
    for ext in exts:
        for f in glob.glob(os.path.join(dirpath, prefix + "*" + ext)):
            base = os.path.basename(f)
            m = re.search(r"-(\d{14})\.", base)      # 形如 -20261103141157.html（%Y%m%d%H%M%S 共 14 位）
            key = m.group(1) if m else base
            groups.setdefault(key, []).append(f)
    order = sorted(groups)
    drop = order[:-keep] if keep > 0 else []
    removed, locked = [], []
    for key in drop:
        for f in groups[key]:
            try:
                os.remove(f)
                removed.append(os.path.basename(f))
            except OSError:
                locked.append(os.path.basename(f))
    return removed, locked


# --------------------------- main ---------------------------

def main():
    ap = argparse.ArgumentParser(description="生成测试全景图与静态可视化素材")
    ap.add_argument("--out", default=REPO, help="输出根目录（默认仓库根）")
    ap.add_argument("--keep", type=int, default=1, help="全景图保留最新几份（默认 1）")
    args = ap.parse_args()

    now = datetime.datetime.now()
    stamp = now.strftime("%Y%m%d%H%M%S")
    date_label = now.strftime("%Y-%m-%d")

    iters = load_iter_ledger()
    trend = load_trend()
    latest_date, hdr, rows = load_latest_matrix()
    heat = heat_dim_client(hdr, rows) if hdr else {}
    packs = client_packages()

    # ① 全景图 HTML（CI 数据快照口径固定为 latest matrix 日期，避免每日无意义 diff）
    snap = latest_date if latest_date != "?" else date_label
    pano_dir = os.path.join(args.out, "panorama")
    os.makedirs(pano_dir, exist_ok=True)
    html = render_html(snap, iters, trend, heat, packs, latest_date)
    html_path = os.path.join(pano_dir, "%s%s-%s.html" % (PREFIX, snap, stamp))
    with io.open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("全景图 HTML: %s" % html_path)

    # ② 全景图 xlsx（可选依赖）
    xlsx_path = os.path.join(pano_dir, "%s%s-%s.xlsx" % (PREFIX, snap, stamp))
    if write_xlsx(xlsx_path, iters, trend, heat, packs):
        print("全景图 XLSX: %s" % xlsx_path)
    else:
        print("全景图 XLSX: （跳过）未安装 openpyxl —— 用 `uv run --with openpyxl python scripts/gen_visuals.py` 或 `pip install openpyxl`")

    # ③ assets/ 静态素材
    assets = os.path.join(args.out, "assets")
    os.makedirs(assets, exist_ok=True)
    node_tests, py_tests = 147, 144      # CI 硬门禁用例数（随仓库更新；来源：npm run test / test:python）
    case_lib = len(rows) if rows else 0
    svgs = {
        "pyramid.svg": svg_pyramid("快照 %s" % snap, node_tests, py_tests, case_lib),
        "coverage-heatmap.svg": svg_heatmap(heat, sorted(heat.keys(), key=lambda s: (int(re.sub(r"\D", "", s) or 0), s)),
                                            sorted({c for d in heat.values() for c in d}), latest_date),
        "framework.svg": svg_framework(snap, ["tm-plan", "mission-expand", "mcp-server(7)", "ops_insights",
                                              "preflight_probe", "classify_failure", "cluster_rootcauses",
                                              "cross_client_consistency", "link_rootcase_case_issue"]),
    }
    for name, content in svgs.items():
        p = os.path.join(assets, name)
        with io.open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print("素材: %s" % p)

    # ④ 只保留最新（跳过被锁）
    removed, locked = prune(pano_dir, PREFIX, args.keep, [".html", ".xlsx"])
    if removed:
        print("清理旧全景图 %d 个：%s" % (len(removed), "、".join(removed)))
    if locked:
        print("⚠ 跳过被占用（可能正被 WPS/Excel 打开）%d 个：%s" % (len(locked), "、".join(locked)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
