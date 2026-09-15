# -*- coding: utf-8 -*-
"""生成测试执行总览看板（自包含单文件 HTML）。

数据源：
    results/Summary/用例矩阵-{设计级|展开级}-总执行结果-<日期>.csv  （跨日趋势，口径复用 report_html._case_status）
    results/Summary/每日测试汇总-<日期>.md                            （被测版本基线）
    metrics/execution.csv                                             （跨迭代执行/通过趋势）

用法:
    python gen_dashboard.py

输出:
    dashboard.html（仓库根目录，GitHub Pages 部署后可访问）
"""
import os, sys, re, csv, datetime
from collections import Counter

SCRIPTS = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(SCRIPTS)
sys.path.insert(0, SCRIPTS)
import report_html as R

SUMMARY_DIR = os.path.join(REPO, "results", "Summary")
OUT = os.path.join(REPO, "dashboard.html")

STATUS_COLOR = {"PASS": "#2ecc71", "FAIL": "#e74c3c", "BLOCKED": "#f39c12",
                "SPEC-MISMATCH": "#e67e22", "NOT_RUN": "#95a5a6"}
STATUS_ORDER = ["PASS", "FAIL", "BLOCKED", "SPEC-MISMATCH", "NOT_RUN"]
STATUS_CN = {"PASS": "通过", "FAIL": "失败", "BLOCKED": "阻塞", "SPEC-MISMATCH": "规格不符", "NOT_RUN": "未执行"}


def available_dates():
    dates = set()
    for f in os.listdir(SUMMARY_DIR):
        m = re.search(r"(\d{4}-\d{2}-\d{2})\.csv$", f)
        if m:
            dates.add(m.group(1))
    return sorted(dates)


def baseline_version(dates):
    for d in reversed(dates):
        md = os.path.join(SUMMARY_DIR, f"每日测试汇总-{d}.md")
        if os.path.isfile(md):
            text = open(md, encoding="utf-8").read()
            m = re.search(r"被测版本：\*\*(.+?)\*\*", text)
            if m:
                return m.group(1), d
    return "—", dates[-1] if dates else "—"


def build_daily(dates):
    daily = []
    for d in dates:
        rows = R.load_summary(d)
        if not rows:
            continue
        cmp = R._compute(rows, [], d, "?")
        daily.append({"date": d, "cmp": cmp})
    return daily


def build_metrics():
    p = os.path.join(REPO, "metrics", "execution.csv")
    if not os.path.isfile(p):
        return []
    rows = list(csv.DictReader(open(p, encoding="utf-8-sig")))
    by_iter = {}
    order = []
    for r in rows:
        it = r["iteration"]
        if it not in by_iter:
            by_iter[it] = {"planned": 0, "executed": 0, "passed": 0, "failed": 0, "blocked": 0, "date": r["date"]}
            order.append(it)
        for k in ("planned", "executed", "passed", "failed", "blocked"):
            try:
                by_iter[it][k] += int(r.get(k) or 0)
            except ValueError:
                pass
    out = []
    for it in order:
        m = by_iter[it]
        ex_rate = round(m["executed"] / m["planned"] * 100, 1) if m["planned"] else 0
        pass_rate = round(m["passed"] / m["executed"] * 100, 1) if m["executed"] else 0
        out.append({"iter": it, "date": m["date"], "exec_rate": ex_rate, "pass_rate": pass_rate, **m})
    return out


def render(days, metrics, version, vdate, gen_ts):
    latest = days[-1]["cmp"]
    st = latest["st"]
    total = latest["total"]
    denom = st["PASS"] + st["FAIL"] + st["SPEC-MISMATCH"]
    rate = f"{round(st['PASS'] / denom * 100)}%" if denom else "—"

    # ---- KPI 卡片 ----
    def kpi(value, label, color):
        return (f'<div style="flex:1;min-width:120px;background:{color};color:#fff;border-radius:8px;'
                f'padding:16px 12px;text-align:center;margin:4px;">'
                f'<div style="font-size:28px;font-weight:700;">{value}</div>'
                f'<div style="font-size:13px;opacity:.9;">{label}</div></div>')

    kpis = (kpi(total, "总用例", "#34495e")
            + kpi(st["PASS"], "PASS", STATUS_COLOR["PASS"])
            + kpi(st["FAIL"], "FAIL", STATUS_COLOR["FAIL"])
            + kpi(st["BLOCKED"], "BLOCKED", STATUS_COLOR["BLOCKED"])
            + kpi(rate, "通过率", "#3498db"))

    # ---- 每日执行趋势表 ----
    daily_head = '<tr style="background:#f2f2f2;">' + ''.join(
        f'<th style="padding:6px 8px;border:1px solid #ddd;">{h}</th>'
        for h in ["日期", "总用例"] + STATUS_ORDER + ["通过率", ""]) + '</tr>'
    daily_rows = ""
    for d in days:
        c = d["cmp"]
        s = c["st"]
        dn = s["PASS"] + s["FAIL"] + s["SPEC-MISMATCH"]
        r = f"{round(s['PASS'] / dn * 100)}%" if dn else "—"
        pct = round(s['PASS'] / dn * 100) if dn else 0
        bar = (f'<div style="height:8px;background:#eee;border-radius:4px;width:120px;margin-left:auto;">'
               f'<div style="height:8px;width:{pct}%;background:#3498db;border-radius:4px;"></div></div>')
        daily_rows += ('<tr><td style="padding:6px 8px;border:1px solid #ddd;white-space:nowrap;"><b>'
                       + d["date"][5:] + '</b></td><td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">'
                       + str(c["total"]) + '</td>'
                       + ''.join(f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;color:{STATUS_COLOR[k]}">'
                                 f'{s[k]}</td>' for k in STATUS_ORDER)
                       + f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;"><b>{r}</b></td>'
                       + f'<td style="padding:6px 8px;border:1px solid #ddd;">{bar}</td></tr>')

    # ---- 通过率折线 SVG ----
    def sparkline(values, color="#3498db", height=120, width=560):
        if len(values) < 2:
            return ""
        w_pad, h_pad = 8, 8
        iw, ih = width - w_pad * 2, height - h_pad * 2
        mx, mn = max(values), min(values)
        span = (mx - mn) or 1
        n = len(values)
        pts = []
        for i, v in enumerate(values):
            x = w_pad + (iw * i / (n - 1))
            y = h_pad + ih - (ih * (v - mn) / span)
            pts.append((round(x, 1), round(y, 1)))
        line = " ".join(f"{x},{y}" for x, y in pts)
        dots = "".join(f'<circle cx="{x}" cy="{y}" r="3" fill="{color}"><title>{values[i]}%</title></circle>'
                       for i, (x, y) in enumerate(pts))
        return (f'<svg viewBox="0 0 {width} {height}" style="width:100%;max-width:{width}px;height:auto;">'
                f'<polyline points="{line}" fill="none" stroke="{color}" stroke-width="2"/>'
                f'{dots}</svg>')

    rate_vals = []
    for d in days:
        s = d["cmp"]["st"]
        dn = s["PASS"] + s["FAIL"] + s["SPEC-MISMATCH"]
        rate_vals.append(round(s["PASS"] / dn * 100) if dn else 0)

    # ---- 客户端概览（最新日，仅智能体聚合行） ----
    client_head = ('<tr style="background:#f2f2f2;">'
                   '<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">智能体</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">状态</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">应执行</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">已执行</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">执行率</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">通过率</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">PASS</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">FAIL</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">BLOCKED</th>'
                   '<th style="padding:6px 8px;border:1px solid #ddd;">SPEC</th></tr>')
    COLOR = {"已执行": "#2ecc71", "存在缺陷": "#e74c3c", "已建包未回填": "#f39c12", "未执行": "#95a5a6"}
    client_rows = ""
    for cl in latest["clients"]:
        ex, p, f, b, s, nr, uf = cl["row"]
        badge = f'<span style="display:inline-block;padding:2px 8px;border-radius:3px;color:#fff;background:{COLOR.get(cl["st_text"],"#95a5a6")}">{cl["st_text"]}</span>'
        client_rows += ('<tr>' + f'<td style="padding:6px 8px;border:1px solid #ddd;"><b>{cl["client"]}</b></td>'
                        + f'<td style="padding:6px 8px;border:1px solid #ddd;">{badge}</td>'
                        + ''.join(f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{v}</td>'
                                  for v in (cl["should"], ex, cl["exec_rate"], cl["pass_rate"], p, f, b, s)) + '</tr>')
    client_overview = (f'共 <b>{len(R.ALL_CLIENTS)}</b> 个智能体：已执行 <b>{latest["executed"]}</b>，'
                       f'已建包未回填 <b>{latest["pkg_only"]}</b>，未执行 <b>{latest["notrun"]}</b>。')

    # ---- 缺陷存量（最新日，按优先级对 FAIL 用例计数） ----
    def case_status(rows):
        cols = [c for c in rows[0].keys() if c not in R.META] if rows else []
        res = {}
        for r in rows:
            res[r.get("ID")] = R._case_status(cols, r)
        return res

    latest_rows = R.load_summary(days[-1]["date"])
    st_map = case_status(latest_rows)
    prio_fail = Counter()
    fail_list = []
    for r in latest_rows:
        s = st_map.get(r.get("ID"))
        if s != "FAIL":
            continue
        prio = (r.get("优先级") or "(空)").strip()
        prio_fail[prio] += 1
        title = R._case_title(r)
        fail_list.append((prio, r.get("ID", ""), title))
    fail_list.sort(key=lambda x: ({"P0": 0, "P1": 1, "P2": 2}.get(x[0], 9), x[1]))

    prio_order = ["P0", "P1", "P2"]
    prio_kpi = "".join(
        kpi(prio_fail.get(p, 0), f"{p} 存量", {"P0": "#c0392b", "P1": "#e67e22", "P2": "#2980b9"}.get(p, "#7f8c8d"))
        for p in prio_order)

    fail_rows = "".join(
        f'<tr><td style="padding:6px 8px;border:1px solid #ddd;"><b style="color:{ {"P0":"#c0392b","P1":"#e67e22","P2":"#2980b9"}.get(pr,"#333") }">{pr}</b></td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;">{cid}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:left;">{t}</td></tr>'
        for pr, cid, t in fail_list) or '<tr><td colspan="3" style="color:#95a5a6;padding:6px;">无 FAIL 用例</td></tr>'

    # ---- 维度分布（最新日） ----
    dim_rows = "".join(
        f'<tr><td style="padding:6px 8px;border:1px solid #ddd;"><b>{x["dim"]}</b></td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{x["count"]}</td>'
        + ''.join(f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{v}</td>' for v in x["prio"])
        + '</tr>' for x in latest["dim_order"])

    # ---- 跨迭代 metrics 表 ----
    metrics_rows = "".join(
        f'<tr><td style="padding:6px 8px;border:1px solid #ddd;"><b>{m["iter"]}</b></td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{m["planned"]}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{m["executed"]}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{m["passed"]}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{m["failed"]}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{m["blocked"]}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;"><b>{m["exec_rate"]}%</b></td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;"><b>{m["pass_rate"]}%</b></td></tr>'
        for m in metrics) or '<tr><td colspan="8" style="color:#95a5a6;padding:6px;">无度量数据</td></tr>'

    html = f"""<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>huaweicloud-devkit 测试执行总览看板</title></head>
<body style="font-family:'Segoe UI',Arial,'Microsoft YaHei',sans-serif;color:#2c3e50;max-width:1040px;margin:20px auto;padding:0 16px;">
<h1 style="border-bottom:3px solid #2c3e50;padding-bottom:8px;">huaweicloud-devkit 测试执行总览看板</h1>
<p style="color:#7f8c8d;">基线版本：<b>{version}</b> ｜ 数据截至：<b>{vdate}</b> ｜ 最后更新：<b>{gen_ts}</b>（北京时间，每小时刷新）</p>

<h2>总体执行（{vdate}）</h2>
<div style="display:flex;flex-wrap:wrap;margin:-4px;">{kpis}</div>
<p style="color:#7f8c8d;font-size:12px;">通过率分母 = PASS+FAIL+SPEC（不含 BLOCKED/NOT_RUN）；与每日汇总口径一致。</p>

<h2>每日执行趋势</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead>{daily_head}</thead><tbody>{daily_rows}</tbody></table>
<div style="margin:12px 0;"><div style="color:#7f8c8d;font-size:12px;margin-bottom:4px;">用例级通过率趋势（%）</div>
{sparkline(rate_vals)}</div>
<p style="color:#95a5a6;font-size:11px;">趋势口径 = 用例级最差去重（与 09-15 每日汇总一致，任一机器 FAIL/BLOCKED 即判该用例未通过）。09-12 为旧版全量口径（300 用例）；09-13/14 当日旧版报告使用「机器×用例」累加口径（通过率分别 92%/91%），本看板已按现行去重口径统一重算，历史数据仅供趋势参考。</p>

<h2>客户端执行概览（{vdate}）</h2>
<p style="color:#7f8c8d;">{client_overview}</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead>{client_head}</thead><tbody>{client_rows}</tbody></table>

<h2>缺陷存量（{vdate}，FAIL 用例按优先级）</h2>
<div style="display:flex;flex-wrap:wrap;margin:-4px;">{prio_kpi}</div>
<table style="border-collapse:collapse;width:100%;font-size:13px;margin-top:8px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;">优先级</th><th style="padding:6px 8px;border:1px solid #ddd;">ID</th><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">标题</th></tr></thead>
<tbody>{fail_rows}</tbody></table>

<h2>各维度用例统计（{vdate}，设计级共 {len(latest["design_rows"])} 条）</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">维度</th><th style="padding:6px 8px;border:1px solid #ddd;">用例数</th>
{''.join(f'<th style="padding:6px 8px;border:1px solid #ddd;">{p}</th>' for p in latest["prio_values"])}</tr></thead>
<tbody>{dim_rows}</tbody></table>

<h2>跨迭代执行率 / 通过率</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">迭代</th><th style="padding:6px 8px;border:1px solid #ddd;">计划</th><th style="padding:6px 8px;border:1px solid #ddd;">已执行</th><th style="padding:6px 8px;border:1px solid #ddd;">通过</th><th style="padding:6px 8px;border:1px solid #ddd;">失败</th><th style="padding:6px 8px;border:1px solid #ddd;">阻塞</th><th style="padding:6px 8px;border:1px solid #ddd;">执行率</th><th style="padding:6px 8px;border:1px solid #ddd;">通过率</th></tr></thead>
<tbody>{metrics_rows}</tbody></table>

<p style="color:#95a5a6;font-size:11px;margin-top:24px;">本看板由 scripts/gen_dashboard.py 自动生成；数据源 results/Summary/（每日总执行结果）与 metrics/execution.csv（跨迭代度量）。执行态与母版用例定义分离，真实结果以 results/Summary/ 为准。</p>
</body></html>"""
    return html


def main():
    dates = available_dates()
    if not dates:
        print("[错误] 未找到 Summary CSV，请先跑 build_summary.py")
        sys.exit(2)
    version, vdate = baseline_version(dates)
    days = build_daily(dates)
    metrics = build_metrics()
    gen_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    html = render(days, metrics, version, vdate, gen_ts)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"总览看板生成: {OUT}")
    print(f"覆盖 {len(days)} 天趋势（{days[0]['date']} ~ {days[-1]['date']}），{len(metrics)} 个迭代度量")


if __name__ == "__main__":
    main()