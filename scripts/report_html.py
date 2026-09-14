# -*- coding: utf-8 -*-
"""生成每日测试汇总 HTML 报告（自包含单文件，内联 CSS，适合邮件发送）。

用法:
    python report_html.py [日期] [被测版本]

数据源:
    results/Summary/用例矩阵-{设计级|展开级}-总执行结果-<日期>.csv  （build_summary.py 生成）
    results/<客户端>/<日期>-<IP>/<OS>/FINDINGS.md                     （缺陷根因，可选）
输出:
    results/Summary/每日测试汇总-<日期>.html

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
                # 复用 file_issue.py 的解析格式：## #N【级别】标题 + **根因**
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


def render(rows, findings, date, version):
    meta = {"层级", "ID", "维度", "标题", "优先级", "展开类型", "枚举对象", "源用例", "当日总执行状态", "当日总执行时间"}
    client_cols = [c for c in rows[0].keys() if c not in meta] if rows else []

    # 执行摘要：全 agent 合计（从各 agent 列统计，而非「当日总执行状态」统计字符串）
    st = Counter()
    for col in client_cols:
        for r in rows:
            v = (r.get(col) or "").strip() or "NOT_RUN"
            st[v] += 1
    total = len(rows)
    denom = st["PASS"] + st["FAIL"] + st["SPEC-MISMATCH"]
    rate = f"{round(st['PASS'] / denom * 100)}%" if denom else "—"

    # 缺陷/阻塞清单：当日总执行状态含 FAIL/BLOCKED/SPEC 的用例
    def worst(s):
        s = s or ""
        for k in ("FAIL", "BLOCKED", "SPEC-MISMATCH"):
            if k in s:
                return k
        return (s or "NOT_RUN")

    problem = [r for r in rows if worst(r.get("当日总执行状态") or "") in ("FAIL", "BLOCKED", "SPEC-MISMATCH")]
    problem.sort(key=lambda r: STATUS_RANK.get(worst(r.get("当日总执行状态") or ""), 9))

    def badge(s):
        return f'<span style="display:inline-block;padding:2px 8px;border-radius:3px;color:#fff;background:{STATUS_COLOR.get(s,"#95a5a6")}">{s or "NOT_RUN"}</span>'

    # 客户端覆盖概览
    client_summary = []
    for col in client_cols:
        cnt = Counter((r.get(col) or "").strip() or "NOT_RUN" for r in rows)
        executed = total - cnt["NOT_RUN"] - cnt[""]
        client_summary.append((col, executed, cnt["PASS"], cnt["FAIL"], cnt["BLOCKED"], cnt["SPEC-MISMATCH"]))

    # —— 智能体执行概览（10 客户端枚举，聚合多机器/多 OS 列）——
    def agent_of(col):
        return col.split("-")[0]
    cols_by_agent = {}
    for col in client_cols:
        cols_by_agent.setdefault(agent_of(col), []).append(col)

    def badge_text(text, color):
        return (f'<span style="display:inline-block;padding:2px 8px;border-radius:3px;'
                f'color:#fff;background:{color}">{text}</span>')

    agent_rows_html = ""
    executed_agents = 0
    pkg_only_agents = 0
    notrun_agents = 0
    for cl in ALL_CLIENTS:
        cols = cols_by_agent.get(cl, [])
        if not cols:
            notrun_agents += 1
            agent_rows_html += (f'<tr><td><b>{cl}</b></td>'
                                f'<td>{badge_text("未执行", "#95a5a6")}</td>'
                                f'<td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>')
            continue
        cnt = Counter()
        unfilled = 0
        for col in cols:
            for r in rows:
                v = (r.get(col) or "").strip()
                if v:
                    cnt[v] += 1
                else:
                    unfilled += 1
        ex = cnt["PASS"] + cnt["FAIL"] + cnt["BLOCKED"] + cnt["SPEC-MISMATCH"]
        if ex:
            executed_agents += 1
            clean = (cnt["FAIL"] + cnt["BLOCKED"] + cnt["SPEC-MISMATCH"]) == 0
            st_text, st_color = ("已执行", "#2ecc71") if clean else ("存在缺陷", "#e74c3c")
        else:
            pkg_only_agents += 1
            st_text, st_color = ("已建包未回填", "#f39c12")
        agent_rows_html += (f'<tr><td><b>{cl}</b></td>'
                            f'<td>{badge_text(st_text, st_color)}</td>'
                            f'<td>{ex}</td>'
                            f'<td>{cnt["PASS"]}</td><td>{cnt["FAIL"]}</td>'
                            f'<td>{cnt["BLOCKED"]}</td><td>{cnt["SPEC-MISMATCH"]}</td>'
                            f'<td>{cnt["NOT_RUN"]}</td><td>{unfilled}</td></tr>')
    agent_overview_line = (f'共 <b>{len(ALL_CLIENTS)}</b> 个智能体：'
        f'<span style="color:#2ecc71">已执行 <b>{executed_agents}</b></span>，'
        f'<span style="color:#f39c12">已建包未回填 <b>{pkg_only_agents}</b></span>，'
        f'<span style="color:#95a5a6">未执行 <b>{notrun_agents}</b></span>。')

    # —— 各维度用例统计（设计级按维度+优先级，展开级按展开类型）——
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
    dim_head = "".join(f'<th style="padding:6px;border:1px solid #ddd;">{p}</th>' for p in prio_values)
    DIM_ORDER = ["D1安装", "D2认证", "D3功能", "D4安全", "D5客户端", "D6性能", "D7兼容", "D8质量", "D9协议", "D10评测"]
    dim_rows_html = "".join(
        f'<tr><td><b>{d}</b></td><td>{dim_count[d]}</td>'
        + "".join(f'<td>{dim_prio[d].get(p, 0)}</td>' for p in prio_values)
        + '</tr>'
        for d in sorted(dim_count, key=lambda x: DIM_ORDER.index(x) if x in DIM_ORDER else 999)
    )
    expand_type_count = Counter((r.get("展开类型") or "(空)") for r in expand_rows)
    expand_rows_html = "".join(
        f'<tr><td><b>{t}</b></td><td>{expand_type_count[t]}</td></tr>'
        for t in sorted(expand_type_count)
    )

    problem_rows = "".join(
        f'<tr><td>{r.get("层级","")}</td><td><b>{r.get("ID","")}</b></td><td>{r.get("优先级","")}</td>'
        f'<td>{r.get("标题","")}</td><td>{badge(worst(r.get("当日总执行状态","")))}</td></tr>'
        for r in problem
    ) or '<tr><td colspan="5" style="color:#95a5a6">无 FAIL/BLOCKED/SPEC 项</td></tr>'

    findings_rows = "".join(
        f'<tr><td>{c}</td><td><b>{sev}</b></td><td>{title}</td><td>{root}</td></tr>'
        for c, sev, title, root in findings
    ) or '<tr><td colspan="4" style="color:#95a5a6">无缺陷记录</td></tr>'

    client_rows = "".join(
        f'<tr><td>{col}</td><td>{ex}</td><td>{p}</td><td>{f}</td><td>{b}</td><td>{s}</td></tr>'
        for col, ex, p, f, b, s in client_summary
    )

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

<h2>智能体执行概览</h2>
<p style="color:#7f8c8d;">{agent_overview_line}</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px;border:1px solid #ddd;">智能体</th><th style="padding:6px;border:1px solid #ddd;">执行状态</th><th style="padding:6px;border:1px solid #ddd;">已执行</th><th style="padding:6px;border:1px solid #ddd;">PASS</th><th style="padding:6px;border:1px solid #ddd;">FAIL</th><th style="padding:6px;border:1px solid #ddd;">BLOCKED</th><th style="padding:6px;border:1px solid #ddd;">SPEC</th><th style="padding:6px;border:1px solid #ddd;">NOT_RUN</th><th style="padding:6px;border:1px solid #ddd;">未回填</th></tr></thead>
<tbody>{agent_rows_html}</tbody></table>
<p style="color:#95a5a6;font-size:11px;">已执行 = PASS+FAIL+BLOCKED+SPEC 计数和；「存在缺陷」= 该智能体有 FAIL/BLOCKED/SPEC 回填；未回填 = 该智能体各单元为空（未回填执行态）。</p>

<h2>各维度用例统计</h2>
<p style="color:#7f8c8d;font-size:12px;">设计级 daily 精选用例（共 {len(design_rows)} 条）按维度分布，优先级 P0/P1/P2：</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px;border:1px solid #ddd;text-align:left;">维度</th><th style="padding:6px;border:1px solid #ddd;">用例数</th>{dim_head}</tr></thead>
<tbody>{dim_rows_html}</tbody></table>
<p style="color:#7f8c8d;font-size:12px;">展开级用例（共 {len(expand_rows)} 条）按展开类型分布：</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px;border:1px solid #ddd;text-align:left;">展开类型</th><th style="padding:6px;border:1px solid #ddd;">用例数</th></tr></thead>
<tbody>{expand_rows_html}</tbody></table>

<h2>缺陷清单（FAIL / BLOCKED / SPEC-MISMATCH）</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px;border:1px solid #ddd;">层级</th><th style="padding:6px;border:1px solid #ddd;">ID</th><th style="padding:6px;border:1px solid #ddd;">优先级</th><th style="padding:6px;border:1px solid #ddd;text-align:left;">标题</th><th style="padding:6px;border:1px solid #ddd;">状态</th></tr></thead>
<tbody>{problem_rows}</tbody></table>

<h2>缺陷根因明细（来自各 agent FINDINGS.md）</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px;border:1px solid #ddd;">客户端</th><th style="padding:6px;border:1px solid #ddd;">级别</th><th style="padding:6px;border:1px solid #ddd;text-align:left;">标题</th><th style="padding:6px;border:1px solid #ddd;text-align:left;">根因</th></tr></thead>
<tbody>{findings_rows}</tbody></table>

<h2>各客户端执行概览（<span style="font-weight:normal;font-size:12px;color:#7f8c8d;">已执行=PASS+FAIL+BLOCKED+SPEC</span>）</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px;border:1px solid #ddd;">客户端-OS</th><th style="padding:6px;border:1px solid #ddd;">已执行</th><th style="padding:6px;border:1px solid #ddd;">PASS</th><th style="padding:6px;border:1px solid #ddd;">FAIL</th><th style="padding:6px;border:1px solid #ddd;">BLOCKED</th><th style="padding:6px;border:1px solid #ddd;">SPEC</th></tr></thead>
<tbody>{client_rows}</tbody></table>

<p style="color:#95a5a6;font-size:11px;margin-top:24px;">本报告由 scripts/report_html.py 自动生成，数据源 results/Summary/ 每日总执行结果。执行态与母版用例定义分离，真实结果以本报告为准。</p>
</body></html>"""


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y-%m-%d")
    version = sys.argv[2] if len(sys.argv) > 2 else "（未指定）"
    rows = load_summary(date)
    if not rows:
        print(f"[错误] 未找到 Summary 数据：请先跑 build_summary.py {date}")
        sys.exit(2)
    findings = collect_findings(date)
    html = render(rows, findings, date, version)
    out = os.path.join(REPO, "results", "Summary", f"每日测试汇总-{date}.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML 报告生成: {out}")
    print(f"总用例 {len(rows)} 条，缺陷根因 {len(findings)} 条")


if __name__ == "__main__":
    main()