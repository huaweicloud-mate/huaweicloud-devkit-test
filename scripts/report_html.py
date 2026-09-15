# -*- coding: utf-8 -*-
"""生成每日测试汇总报告（HTML 自包含单文件 + Markdown 版）。

用法:
    python report_html.py [日期] [被测版本]

数据源:
    results/Summary/用例矩阵-{设计级|展开级}-总执行结果-<日期>.csv  （build_summary.py 生成）
    results/<客户端>/<日期>-<IP>/<OS>/FINDINGS.md                     （缺陷根因，可选）
输出:
    results/Summary/每日测试汇总-<日期>.html
    results/Summary/每日测试汇总-<日期>.md    （同口径 markdown 版）

通过率口径（与 daily-agent-report 一致）：分母 = PASS + FAIL + SPEC-MISMATCH（不含 BLOCKED/NOT_RUN）。
"""
import os, sys, csv, datetime, re
from collections import Counter

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {"Summary", "Regression", "version", "history"}
STATUS_COLOR = {"PASS": "#2ecc71", "FAIL": "#e74c3c", "BLOCKED": "#f39c12",
                "SPEC-MISMATCH": "#e67e22", "NOT_RUN": "#95a5a6", "": "#95a5a6"}
STATUS_RANK = {"FAIL": 0, "SPEC-MISMATCH": 1, "BLOCKED": 2, "NOT_RUN": 3, "PASS": 4, "": 5}
# 10 个智能体（客户端）权威枚举，与 scripts/hourly_sync.py 的 CLIENTS 一致
ALL_CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
               "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]

META = {"层级", "ID", "维度", "标题", "优先级", "展开类型", "枚举对象", "源用例",
        "当日总执行状态", "当日总执行时间"}
DIM_ORDER = ["D1安装", "D2认证", "D3功能", "D4安全", "D5客户端", "D6性能", "D7兼容", "D8质量", "D9协议", "D10评测"]


def load_summary(date):
    rows = []
    for kind in ("设计级", "展开级"):
        p = os.path.join(REPO, "results", "Summary", f"用例矩阵-{kind}-总执行结果-{date}.csv")
        if os.path.isfile(p):
            rows += list(csv.DictReader(open(p, encoding="utf-8-sig")))
    return rows


def collect_findings(date):
    """遍历各 agent 目录读 FINDINGS.md，提取 (级别, 标题, 根因) 列表。"""
    findings = []
    results_dir = os.path.join(REPO, "results")
    if not os.path.isdir(results_dir):
        return findings
    for client in sorted(os.listdir(results_dir)):
        if client in SKIP_DIRS:
            continue
        cdir = os.path.join(results_dir, client)
        if not os.path.isdir(cdir):
            continue
        for sub in sorted(os.listdir(cdir)):
            if not sub.startswith(date + "-"):
                continue
            for os_name in ("Windows", "Linux"):
                fp = os.path.join(cdir, sub, os_name, "FINDINGS.md")
                if not os.path.isfile(fp):
                    continue
                text = open(fp, encoding="utf-8").read()
                for m in re.finditer(r"^## #\d+【([^】]+)】(.+)$", text, re.M):
                    sev, title = m.group(1), m.group(2).strip()
                    if re.search(r"非产品缺陷|测试侧|不予提单", sev):
                        continue
                    seg = text[m.end():]
                    nxt = re.search(r"^## ", seg, re.M)
                    seg = seg[:nxt.start()] if nxt else seg
                    root = re.search(r"[-*]\s*\*\*根因[^*]*\*\*[：:]\s*(.+)", seg)
                    findings.append((client, sev, title, root.group(1).strip() if root else "见证据"))
    return findings


def _worst(s):
    s = s or ""
    for k in ("FAIL", "BLOCKED", "SPEC-MISMATCH"):
        if k in s:
            return k
    return (s or "NOT_RUN").strip() or "NOT_RUN"


def _case_title(r):
    if r.get("层级") == "展开级":
        obj = (r.get("枚举对象") or "").strip()
        src = (r.get("源用例") or "").strip()
        if obj and src:
            return f"{obj} · {src}"
        if obj:
            return obj
        return (r.get("展开类型") or "").strip() or "-"
    return (r.get("标题") or "").strip() or "-"


def _agent_of(col):
    return col.split("-")[0]


def _case_status(client_cols, r):
    """用例级去重：返回该用例在所有客户端列中的「最差」状态，跳过 NA（不涉及）。"""
    has = set()
    for col in client_cols:
        v = (r.get(col) or "").strip()
        if v and v != "NA":
            has.add(v)
    for k in ("FAIL", "SPEC-MISMATCH", "BLOCKED", "NOT_RUN", "PASS"):
        if k in has:
            return k
    return "NOT_RUN"


def _compute(rows, findings, date, version):
    """准备渲染所需的全部统计数据（HTML/MD 共用）。返回结构化 dict。"""
    client_cols = [c for c in rows[0].keys() if c not in META] if rows else []

    st = Counter()
    for r in rows:
        st[_case_status(client_cols, r)] += 1
    total = len(rows)
    denom = st["PASS"] + st["FAIL"] + st["SPEC-MISMATCH"]
    rate = f"{round(st['PASS'] / denom * 100)}%" if denom else "—"

    def col_stats(cols):
        """用例去重口径：该客户端(cols)涉及的用例取最差状态（跳过 NA=不涉及）。"""
        cnt = Counter()
        unfilled = 0
        for r in rows:
            vals = {(r.get(c) or "").strip() for c in cols} - {"NA", ""}
            if not vals:
                if all((r.get(c) or "").strip() == "NA" for c in cols):
                    continue  # 全 NA = 不涉及，跳过
                unfilled += 1  # 涉及但全空 = 未回填
            else:
                st_ = next((k for k in ("FAIL", "SPEC-MISMATCH", "BLOCKED", "NOT_RUN", "PASS") if k in vals), "NOT_RUN")
                cnt[st_] += 1
        ex = cnt["PASS"] + cnt["FAIL"] + cnt["BLOCKED"] + cnt["SPEC-MISMATCH"]
        if ex:
            st_text = "已执行" if (cnt["FAIL"] + cnt["BLOCKED"] + cnt["SPEC-MISMATCH"]) == 0 else "存在缺陷"
        else:
            st_text = "已建包未回填"
        return ex, cnt["PASS"], cnt["FAIL"], cnt["BLOCKED"], cnt["SPEC-MISMATCH"], cnt["NOT_RUN"], unfilled, st_text

    def client_should(cols):
        """该客户端「应执行」的用例数 = 设计级全部 + 展开级中非 NA（涉及本客户端）的用例数。"""
        design = expand = 0
        for r in rows:
            involves = any((r.get(c) or "").strip() != "NA" for c in cols)
            if r.get("层级") == "设计级" and involves:
                design += 1
            elif r.get("层级") == "展开级" and involves:
                expand += 1
        return design + expand

    # 客户端概览
    clients = []
    executed = pkg_only = notrun = 0
    for cl in ALL_CLIENTS:
        cols = [c for c in client_cols if _agent_of(c) == cl]
        if not cols:
            notrun += 1
            clients.append({"client": cl, "cols": [], "st_text": "未执行", "row": (0, 0, 0, 0, 0, 0, 0), "should": 0, "machines": []})
            continue
        ex, p, f, b, s, nr, uf, st_text = col_stats(cols)
        should = client_should(cols)
        exec_rate = f"{round(ex / should * 100)}%" if should else "—"
        pass_denom = p + f + s
        pass_rate = f"{round(p / pass_denom * 100)}%" if pass_denom else "—"
        if ex:
            executed += 1
        else:
            pkg_only += 1
        machines = []
        for col in cols:
            me = col_stats([col])
            mshould = client_should([col])
            m_er = f"{round(me[0] / mshould * 100)}%" if mshould else "—"
            m_pd = me[1] + me[2] + me[4]
            m_pr = f"{round(me[1] / m_pd * 100)}%" if m_pd else "—"
            ip_os = col[len(cl) + 1:]
            machines.append({"ip_os": ip_os, "st_text": me[7], "row": me[:7], "should": mshould, "exec_rate": m_er, "pass_rate": m_pr})
        clients.append({"client": cl, "cols": cols, "st_text": st_text, "row": (ex, p, f, b, s, nr, uf), "should": should, "exec_rate": exec_rate, "pass_rate": pass_rate, "machines": machines})

    # 维度统计
    design_rows = [r for r in rows if r.get("层级") == "设计级"]
    expand_rows = [r for r in rows if r.get("层级") == "展开级"]
    dim_count = Counter((r.get("维度") or "(空)") for r in design_rows)
    dim_prio = {}
    for r in design_rows:
        d = r.get("维度") or "(空)"
        p = (r.get("优先级") or "").strip() or "(空)"
        dim_prio.setdefault(d, Counter())[p] += 1
    prio_values = sorted({(r.get("优先级") or "").strip() or "(空)" for r in design_rows},
                         key=lambda x: ({"P0": 0, "P1": 1, "P2": 2}.get(x, 9), x))
    dim_order = []
    for d in sorted(dim_count, key=lambda x: DIM_ORDER.index(x) if x in DIM_ORDER else 999):
        dim_order.append({"dim": d, "count": dim_count[d],
                          "prio": [dim_prio[d].get(p, 0) for p in prio_values]})
    expand_type_count = Counter((r.get("展开类型") or "(空)") for r in expand_rows)
    expand_order = [{"type": t, "count": expand_type_count[t]} for t in sorted(expand_type_count)]

    # 问题清单
    problem = [r for r in rows if _worst(r.get("当日总执行状态")) in ("FAIL", "BLOCKED", "SPEC-MISMATCH")]
    problem.sort(key=lambda r: STATUS_RANK.get(_worst(r.get("当日总执行状态")), 9))

    return {
        "rows": rows, "findings": findings, "date": date, "version": version,
        "client_cols": client_cols, "st": st, "total": total, "rate": rate,
        "clients": clients, "executed": executed, "pkg_only": pkg_only, "notrun": notrun,
        "design_rows": design_rows, "expand_rows": expand_rows,
        "dim_order": dim_order, "prio_values": prio_values, "expand_order": expand_order,
        "problem": problem,
    }


def render(rows, findings, date, version):
    d = _compute(rows, findings, date, version)
    st, total, rate = d["st"], d["total"], d["rate"]
    clients, executed, pkg_only, notrun = d["clients"], d["executed"], d["pkg_only"], d["notrun"]
    prio_values, dim_order, expand_order = d["prio_values"], d["dim_order"], d["expand_order"]
    design_rows, expand_rows, problem = d["design_rows"], d["expand_rows"], d["problem"]

    def badge(s):
        return f'<span style="display:inline-block;padding:2px 8px;border-radius:3px;color:#fff;background:{STATUS_COLOR.get(s,"#95a5a6")}">{s or "NOT_RUN"}</span>'

    def badge_text(text, color):
        return f'<span style="display:inline-block;padding:2px 8px;border-radius:3px;color:#fff;background:{color}">{text}</span>'

    COLOR = {"已执行": "#2ecc71", "存在缺陷": "#e74c3c", "已建包未回填": "#f39c12", "未执行": "#95a5a6"}

    def stat_cells(should, ex, er, pr, p, f, b, s, nr, uf):
        td = 'style="padding:6px 8px;border:1px solid #ddd;text-align:center;"'
        return (f'<td {td}>{should}</td><td {td}>{ex}</td><td {td}>{er}</td><td {td}>{pr}</td><td {td}>{p}</td><td {td}>{f}</td>'
                f'<td {td}>{b}</td><td {td}>{s}</td><td {td}>{nr}</td><td {td}>{uf}</td>')

    client_rows_html = ""
    for cl in clients:
        ex, p, f, b, s, nr, uf = cl["row"]
        client_rows_html += (f'<tr style="background:#f0f5fb;">'
                             f'<td style="padding:6px 8px;border:1px solid #ddd;border-left:4px solid #3498db;font-weight:700;color:#2c3e50;">{cl["client"]}</td>'
                             f'<td style="padding:6px 8px;border:1px solid #ddd;">{badge_text(cl["st_text"], COLOR.get(cl["st_text"], "#95a5a6"))}</td>'
                             + stat_cells(cl["should"], ex, cl["exec_rate"], cl["pass_rate"], p, f, b, s, nr, uf) + '</tr>')
        for m in cl["machines"]:
            me = m["row"]
            client_rows_html += (f'<tr>'
                                 f'<td style="padding:6px 8px 6px 26px;border:1px solid #ddd;border-left:4px solid transparent;color:#7f8c8d;font-size:12px;">└ {m["ip_os"]}</td>'
                                 f'<td style="padding:6px 8px;border:1px solid #ddd;">{badge_text(m["st_text"], COLOR.get(m["st_text"], "#95a5a6"))}</td>'
                                 + stat_cells(m["should"], me[0], m["exec_rate"], m["pass_rate"], me[1], me[2], me[3], me[4], me[5], me[6]) + '</tr>')
    client_overview_line = (f'共 <b>{len(ALL_CLIENTS)}</b> 个智能体：'
        f'<span style="color:#2ecc71">已执行 <b>{executed}</b></span>，'
        f'<span style="color:#f39c12">已建包未回填 <b>{pkg_only}</b></span>，'
        f'<span style="color:#95a5a6">未执行 <b>{notrun}</b></span>。')

    dim_head = "".join(f'<th style="padding:6px;border:1px solid #ddd;">{p}</th>' for p in prio_values)
    dim_rows_html = "".join(
        f'<tr><td><b>{x["dim"]}</b></td><td>{x["count"]}</td>'
        + "".join(f'<td>{v}</td>' for v in x["prio"]) + '</tr>'
        for x in dim_order
    )
    expand_rows_html = "".join(
        f'<tr><td><b>{x["type"]}</b></td><td>{x["count"]}</td></tr>' for x in expand_order
    )

    problem_rows = "".join(
        f'<tr><td>{r.get("层级","")}</td><td><b>{r.get("ID","")}</b></td><td>{r.get("优先级","")}</td>'
        f'<td>{_case_title(r)}</td><td>{badge(_worst(r.get("当日总执行状态","")))}</td></tr>'
        for r in problem
    ) or '<tr><td colspan="5" style="color:#95a5a6">无 FAIL/BLOCKED/SPEC 项</td></tr>'

    findings_rows = "".join(
        f'<tr><td>{c}</td><td><b>{sev}</b></td><td>{title}</td><td>{root}</td></tr>'
        for c, sev, title, root in findings
    ) or '<tr><td colspan="4" style="color:#95a5a6">无缺陷记录</td></tr>'

    return f"""<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>每日测试汇总 - {date}</title></head>
<body style="font-family:'Segoe UI',Arial,'Microsoft YaHei',sans-serif;color:#2c3e50;max-width:960px;margin:20px auto;padding:0 16px;">
<h1 style="border-bottom:3px solid #2c3e50;padding-bottom:8px;">huaweicloud-devkit 每日测试汇总报告</h1>
<p style="color:#7f8c8d;">日期：<b>{date}</b> ｜ 被测版本：<b>{version}</b> ｜ 生成时间：<b>{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</b>（北京时间）</p>

<h2>执行摘要</h2>
<table style="border-collapse:collapse;width:100%;">
<tr>
<td style="background:#34495e;color:#fff;padding:12px;text-align:center;border-radius:4px;margin:4px;"><div style="font-size:24px;font-weight:bold;">{total}</div><div>总用例</div></td>
<td style="background:#2ecc71;color:#fff;padding:12px;text-align:center;border-radius:4px;margin:4px;"><div style="font-size:24px;font-weight:bold;">{st['PASS']}</div><div>PASS</div></td>
<td style="background:#e74c3c;color:#fff;padding:12px;text-align:center;border-radius:4px;margin:4px;"><div style="font-size:24px;font-weight:bold;">{st['FAIL']}</div><div>FAIL</div></td>
<td style="background:#f39c12;color:#fff;padding:12px;text-align:center;border-radius:4px;margin:4px;"><div style="font-size:24px;font-weight:bold;">{st['BLOCKED']}</div><div>BLOCKED</div></td>
<td style="background:#e67e22;color:#fff;padding:12px;text-align:center;border-radius:4px;margin:4px;"><div style="font-size:24px;font-weight:bold;">{st['SPEC-MISMATCH']}</div><div>SPEC</div></td>
<td style="background:#95a5a6;color:#fff;padding:12px;text-align:center;border-radius:4px;margin:4px;"><div style="font-size:24px;font-weight:bold;">{st['NOT_RUN']}</div><div>NOT_RUN</div></td>
<td style="background:#3498db;color:#fff;padding:12px;text-align:center;border-radius:4px;margin:4px;"><div style="font-size:24px;font-weight:bold;">{rate}</div><div>通过率</div></td>
</tr>
</table>
<p style="color:#7f8c8d;font-size:12px;">通过率分母 = PASS+FAIL+SPEC（不含 BLOCKED/NOT_RUN）</p>

<h2>客户端执行概览</h2>
<p style="color:#7f8c8d;">{client_overview_line}</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">智能体 / 机器</th><th style="padding:6px 8px;border:1px solid #ddd;">执行状态</th><th style="padding:6px 8px;border:1px solid #ddd;">应执行</th><th style="padding:6px 8px;border:1px solid #ddd;">已执行</th><th style="padding:6px 8px;border:1px solid #ddd;">执行率</th><th style="padding:6px 8px;border:1px solid #ddd;">通过率</th><th style="padding:6px 8px;border:1px solid #ddd;">PASS</th><th style="padding:6px 8px;border:1px solid #ddd;">FAIL</th><th style="padding:6px 8px;border:1px solid #ddd;">BLOCKED</th><th style="padding:6px 8px;border:1px solid #ddd;">SPEC</th><th style="padding:6px 8px;border:1px solid #ddd;">NOT_RUN</th><th style="padding:6px 8px;border:1px solid #ddd;">未回填</th></tr></thead>
<tbody>{client_rows_html}</tbody></table>
<p style="color:#95a5a6;font-size:11px;">加粗行 = 智能体聚合（多机/多 OS 求并）；缩进「└ IP-OS」行 = 该智能体各机器明细。已执行 = PASS+FAIL+BLOCKED+SPEC；「存在缺陷」= 有 FAIL/BLOCKED/SPEC；「未回填」= 单元格为空。</p>

<h2>各维度用例统计</h2>
<p style="color:#7f8c8d;font-size:12px;">设计级 daily 精选用例（共 {len(design_rows)} 条）按维度分布，优先级 P0/P1/P2：</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">维度</th><th style="padding:6px 8px;border:1px solid #ddd;">用例数</th>{dim_head}</tr></thead>
<tbody>{dim_rows_html}</tbody></table>
<p style="color:#7f8c8d;font-size:12px;">展开级用例（共 {len(expand_rows)} 条）按展开类型分布：</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">展开类型</th><th style="padding:6px 8px;border:1px solid #ddd;">用例数</th></tr></thead>
<tbody>{expand_rows_html}</tbody></table>

<h2>缺陷清单（FAIL / BLOCKED / SPEC-MISMATCH）</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px;border:1px solid #ddd;">层级</th><th style="padding:6px;border:1px solid #ddd;">ID</th><th style="padding:6px;border:1px solid #ddd;">优先级</th><th style="padding:6px;border:1px solid #ddd;text-align:left;">标题</th><th style="padding:6px;border:1px solid #ddd;">状态</th></tr></thead>
<tbody>{problem_rows}</tbody></table>

<h2>缺陷根因明细（来自各 agent FINDINGS.md）</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px;border:1px solid #ddd;">客户端</th><th style="padding:6px;border:1px solid #ddd;">级别</th><th style="padding:6px;border:1px solid #ddd;text-align:left;">标题</th><th style="padding:6px;border:1px solid #ddd;text-align:left;">根因</th></tr></thead>
<tbody>{findings_rows}</tbody></table>

<p style="color:#95a5a6;font-size:11px;margin-top:24px;">本报告由 scripts/report_html.py 自动生成，数据源 results/Summary/ 每日总执行结果。执行态与母版用例定义分离，真实结果以本报告为准。</p>
</body></html>"""


def render_md(rows, findings, date, version):
    """渲染 markdown 版每日测试汇总报告（与 HTML 同数据源、同口径）。"""
    d = _compute(rows, findings, date, version)
    st, total, rate = d["st"], d["total"], d["rate"]
    clients, executed, pkg_only, notrun = d["clients"], d["executed"], d["pkg_only"], d["notrun"]
    prio_values, dim_order, expand_order = d["prio_values"], d["dim_order"], d["expand_order"]
    design_rows, expand_rows, problem = d["design_rows"], d["expand_rows"], d["problem"]

    client_lines = []
    for cl in clients:
        ex, p, f, b, s, nr, uf = cl["row"]
        client_lines.append(f"| **{cl['client']}** | {cl['st_text']} | {cl['should']} | {ex} | {cl['exec_rate']} | {cl['pass_rate']} | {p} | {f} | {b} | {s} | {nr} | {uf} |")
        for m in cl["machines"]:
            e2, p2, f2, b2, s2, nr2, uf2 = m["row"]
            client_lines.append(f"| └ {m['ip_os']} | {m['st_text']} | {m['should']} | {e2} | {m['exec_rate']} | {m['pass_rate']} | {p2} | {f2} | {b2} | {s2} | {nr2} | {uf2} |")
    overview = (f"共 **{len(ALL_CLIENTS)}** 个智能体：**已执行 {executed}**、"
                f"**已建包未回填 {pkg_only}**、**未执行 {notrun}**。")

    dim_lines = [f"| {x['dim']} | {x['count']} | " + " | ".join(str(v) for v in x["prio"]) + " |" for x in dim_order]
    expand_lines = [f"| {x['type']} | {x['count']} |" for x in expand_order]

    problem_lines = [
        f"| {r.get('层级','')} | {r.get('ID','')} | {r.get('优先级','')} | {_case_title(r)} | {_worst(r.get('当日总执行状态'))} |"
        for r in problem
    ] or ["| — | — | — | 无 FAIL/BLOCKED/SPEC 项 | — |"]

    findings_lines = [
        f"| {c} | {sev} | {title} | {root} |" for c, sev, title, root in findings
    ] or ["| — | — | 无缺陷记录 | — |"]

    prio_head = " | ".join(prio_values) if prio_values else "优先级"
    prio_sep = " | ".join(["---"] * (1 + len(prio_values)))

    return f"""# huaweicloud-devkit 每日测试汇总报告

日期：**{date}** ｜ 被测版本：**{version}** ｜ 生成时间：**{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}**（北京时间）

## 执行摘要

| 总用例 | PASS | FAIL | BLOCKED | SPEC-MISMATCH | NOT_RUN | 通过率 |
| --- | --- | --- | --- | --- | --- | --- |
| {total} | {st['PASS']} | {st['FAIL']} | {st['BLOCKED']} | {st['SPEC-MISMATCH']} | {st['NOT_RUN']} | {rate} |

> 通过率分母 = PASS+FAIL+SPEC（不含 BLOCKED/NOT_RUN）

## 客户端执行概览

{overview}

| 智能体 | 执行状态 | 应执行 | 已执行 | 执行率 | 通过率 | PASS | FAIL | BLOCKED | SPEC | NOT_RUN | 未回填 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
{chr(10).join(client_lines)}

## 各维度用例统计

### 设计级（共 {len(design_rows)} 条）

| 维度 | 用例数 | {prio_head} |
| --- | --- | {prio_sep} |
{chr(10).join(dim_lines)}

### 展开级（共 {len(expand_rows)} 条）

| 展开类型 | 用例数 |
| --- | --- |
{chr(10).join(expand_lines)}

## 缺陷清单（FAIL / BLOCKED / SPEC-MISMATCH）

| 层级 | ID | 优先级 | 标题 | 状态 |
| --- | --- | --- | --- | --- |
{chr(10).join(problem_lines)}

## 缺陷根因明细（来自各 agent FINDINGS.md）

| 客户端 | 级别 | 标题 | 根因 |
| --- | --- | --- | --- |
{chr(10).join(findings_lines)}

> 本报告由 scripts/report_html.py 自动生成，数据源 results/Summary/ 每日总执行结果。执行态与母版用例定义分离，真实结果以本报告为准。
"""


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y-%m-%d")
    version = sys.argv[2] if len(sys.argv) > 2 else "（未指定）"
    rows = load_summary(date)
    if not rows:
        print(f"[错误] 未找到 Summary 数据：请先跑 build_summary.py {date}")
        sys.exit(2)
    findings = collect_findings(date)

    html = render(rows, findings, date, version)
    html_out = os.path.join(REPO, "results", "Summary", f"每日测试汇总-{date}.html")
    with open(html_out, "w", encoding="utf-8") as f:
        f.write(html)

    md = render_md(rows, findings, date, version)
    md_out = os.path.join(REPO, "results", "Summary", f"每日测试汇总-{date}.md")
    with open(md_out, "w", encoding="utf-8") as f:
        f.write(md)

    print(f"HTML 报告生成: {html_out}")
    print(f"Markdown 报告生成: {md_out}")
    print(f"总用例 {len(rows)} 条，缺陷根因 {len(findings)} 条")


if __name__ == "__main__":
    main()