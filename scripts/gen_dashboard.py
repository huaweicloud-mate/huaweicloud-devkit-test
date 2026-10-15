# -*- coding: utf-8 -*-
"""生成测试执行总览看板（自包含单文件 HTML）。

数据源（以「每日测试汇总报告」为准，不再自行重算）：
    results/Summary/每日测试汇总-<日期>.md / .html   （每日执行摘要 = 跨日趋势）
    results/Summary/用例矩阵-*-总执行结果-<日期>.csv   （仅用于最新日「客户端/维度/缺陷」明细）
    results/UX专项/UX专项-<日期>.json                （UX 专项门禁三态；scripts/gen_ux_special.py 生成）
    test-cases/ux/用例矩阵-体验级.csv                （UX 用例设计态概览；真源 = 同目录 gen_ux.py）

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
UX_DIR = os.path.join(REPO, "results", "UX专项")
UX_CSV = os.path.join(REPO, "test-cases", "ux", "用例矩阵-体验级.csv")
OUT = os.path.join(REPO, "dashboard.html")

STATUS_COLOR = {"PASS": "#2ecc71", "FAIL": "#e74c3c", "BLOCKED": "#f39c12",
                "SPEC-MISMATCH": "#e67e22", "NOT_RUN": "#95a5a6"}
STATUS_ORDER = ["PASS", "FAIL", "BLOCKED", "SPEC-MISMATCH", "NOT_RUN"]


def available_dates():
    """从「每日测试汇总」报告文件扫描有报告的日期。"""
    dates = set()
    for f in os.listdir(SUMMARY_DIR):
        m = re.search(r"每日测试汇总-(\d{4}-\d{2}-\d{2})\.(?:md|html)$", f)
        if m:
            dates.add(m.group(1))
    return sorted(dates)


def rate_num(s):
    m = re.search(r"(\d+(?:\.\d+)?)", s or "")
    return float(m.group(1)) if m else 0.0


def parse_md_summary(text):
    m = re.search(r"## 执行摘要\s*\n\s*\|[^\n]*\|\s*\n\s*\|[\s\-|]*\|\s*\n\s*\|([^\n]+)\|", text)
    if not m:
        return None
    cells = [c.strip() for c in m.group(1).strip().strip("|").split("|")]
    if len(cells) < 7:
        return None
    try:
        return {"total": int(cells[0]), "pass": int(cells[1]), "fail": int(cells[2]),
                "blocked": int(cells[3]), "spec": int(cells[4]), "not_run": int(cells[5]),
                "rate": cells[6].strip()}
    except (ValueError, IndexError):
        return None


def parse_html_summary(text):
    cards = re.findall(r'font-size:24px;font-weight:bold;">([^<]+)</div><div>([^<]+)</div>', text)
    d = {}
    for val, label in cards:
        d[label.strip()] = val.strip()
    try:
        return {"total": int(d.get("总用例", 0)), "pass": int(d.get("PASS", 0)),
                "fail": int(d.get("FAIL", 0)), "blocked": int(d.get("BLOCKED", 0)),
                "spec": int(d.get("SPEC", d.get("SPEC-MISMATCH", 0))),
                "not_run": int(d.get("NOT_RUN", 0)), "rate": d.get("通过率", "—").strip()}
    except (ValueError, KeyError):
        return None


def load_report_summary(date):
    md = os.path.join(SUMMARY_DIR, f"每日测试汇总-{date}.md")
    if os.path.isfile(md):
        s = parse_md_summary(open(md, encoding="utf-8").read())
        if s:
            return s
    html = os.path.join(SUMMARY_DIR, f"每日测试汇总-{date}.html")
    if os.path.isfile(html):
        s = parse_html_summary(open(html, encoding="utf-8").read())
        if s:
            return s
    return None


def build_daily(dates):
    daily = []
    for d in dates:
        s = load_report_summary(d)
        if s:
            daily.append({"date": d, "summary": s})
    return daily


def extract_sut_version(text):
    """从客户端测试报告提取「被测版本（SUT）」，返回版本号字符串或 None。"""
    line = re.search(r"被测版本（SUT）[^\n]*", text)
    if not line:
        return None
    m = re.search(r"\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?", line.group(0))
    return m.group(0) if m else None


def daily_tested_version(date):
    """汇总某日各客户端报告的被测版本（SUT，多数投票），返回版本串或 None。"""
    vers = Counter()
    results_dir = os.path.join(REPO, "results")
    if not os.path.isdir(results_dir):
        return None
    for client in sorted(os.listdir(results_dir)):
        if client in ("Summary", "Regression", "version", "history"):
            continue
        cdir = os.path.join(results_dir, client)
        if not os.path.isdir(cdir):
            continue
        for sub in sorted(os.listdir(cdir)):
            if not sub.startswith(date + "-"):
                continue
            for osn in ("Windows", "Linux"):
                osdir = os.path.join(cdir, sub, osn)
                if not os.path.isdir(osdir):
                    continue
                for fn in os.listdir(osdir):
                    if not fn.endswith("测试报告.md"):
                        continue
                    v = extract_sut_version(open(os.path.join(osdir, fn), encoding="utf-8").read())
                    if v:
                        vers[v] += 1
    return vers.most_common(1)[0][0] if vers else None


def baseline_version(dates):
    """最新日被测版本：优先取客户端报告「被测版本（SUT）」，取不到回退「—」。"""
    for d in reversed(dates):
        v = daily_tested_version(d)
        if v:
            return v, d
    return "—", dates[-1] if dates else "—"


def _parse_counts(status_line, level):
    m = re.search(level + r"\s*[\d\s条]*[（(]([^）)]*)[）)]", status_line or "")
    if not m:
        return {}
    counts = {}
    for k, v in re.findall(r"(PASS|FAIL|SPEC-MISMATCH|BLOCKED|NOT_RUN)\s+(\d+)", m.group(1)):
        counts[k] = int(v)
    return counts


def _fmt_counts(c):
    if not c:
        return "—"
    order = ["PASS", "FAIL", "SPEC-MISMATCH", "BLOCKED", "NOT_RUN"]
    return " · ".join(f"{k} {c[k]}" for k in order if k in c) or "—"


def _stat_level(cases, level):
    return dict(Counter(x["status"] for x in cases if x["level"] == level))


def _load_archive_full(rel):
    """读取版本全量执行包：用例明细 + 状态统计 + 设计级维度分布 + issue 关联。"""
    cases = []
    kpi = Counter()
    dims = {}
    dim_exec = {}
    expand_exec = {}
    base = os.path.join(REPO, rel.strip().strip("`").rstrip("/\\"))
    for level, fn, tkey in [("设计级", "用例矩阵-设计级.csv", "标题"), ("展开级", "用例矩阵-展开级.csv", "枚举对象")]:
        fp = os.path.join(base, fn)
        if not os.path.isfile(fp):
            continue
        for r in csv.DictReader(open(fp, encoding="utf-8-sig")):
            title = (r.get(tkey) or "").strip()
            if level == "展开级" and not title:
                title = (r.get("展开类型") or "").strip()
            status = (r.get("执行状态") or "").strip() or "NOT_RUN"
            kpi[status] += 1
            grp = (r.get("维度") or r.get("展开类型") or "(空)").strip()
            cases.append({
                "level": level, "id": r.get("ID", ""), "prio": (r.get("优先级") or "").strip(),
                "title": title, "status": status, "group": grp,
                "blocked": (r.get("blockedReason") or "").strip(),
            })
            if level == "设计级":
                d = (r.get("维度") or "(空)").strip()
                d_info = dims.setdefault(d, {"count": 0, "prio": Counter()})
                d_info["count"] += 1
                d_info["prio"][(r.get("优先级") or "").strip()] += 1
                dim_exec.setdefault(d, Counter())[status] += 1
            else:
                et = (r.get("展开类型") or "(空)").strip()
                expand_exec.setdefault(et, Counter())[status] += 1
    links = {}
    fp = os.path.join(base, "HISTORY_LINKS.md")
    if os.path.isfile(fp):
        links = _parse_history_links(open(fp, encoding="utf-8").read())
    return {"cases": cases, "kpi": dict(kpi), "dims": dims, "dim_exec": dim_exec, "expand_exec": expand_exec, "links": links}


def load_versions():
    """从 results/version/<版本>/README.md 解析版本全量测试收口记录。"""
    versions = []
    vdir = os.path.join(REPO, "results", "version")
    if not os.path.isdir(vdir):
        return versions
    for name in sorted(os.listdir(vdir), reverse=True):
        rd = os.path.join(vdir, name, "README.md")
        if not os.path.isfile(rd):
            continue
        text = open(rd, encoding="utf-8").read()
        obj = ""
        mc = re.search(r"实际测试对象：[^\n]*?commit\s+`([0-9a-fA-F]+)`", text)
        commit = mc.group(1)[:7] if mc else ""
        mb = re.search(r"commit\s+`[0-9a-fA-F]+`[（(]([^\s，,）)]+)", text)
        branch = mb.group(1).strip() if mb else ""
        obj = f"{branch} @ {commit}" if branch or commit else ""
        tool = ""
        m = re.search(r"工具全集[：:]\s*(\d+)", text)
        if m:
            tool = m.group(1)
        env = ""
        m = re.search(r"Node\s*/\s*npm\s*/\s*Python[：:]\s*(.+)", text) or re.search(r"Node\s*/\s*npm[：:]\s*(.+)", text)
        if m:
            env = m.group(1).strip()
        defect_rows = []
        m = re.search(r"## 缺陷.*?\n(\|.*\|(?:\s*\n\|.*\|)+)", text, re.S)
        if m:
            for line in m.group(1).split("\n"):
                line = line.strip()
                if not line.startswith("|"):
                    continue
                cells = [c.strip() for c in line.strip("|").split("|")]
                if len(cells) >= 3 and cells[0] not in ("用例",) and not re.match(r"^[-:\s]+$", cells[0]):
                    defect_rows.append(tuple(cells[:3]))
        # 归档目录（README 表格中 results/version/.../ 路径，可取多个 OS）
        archives = []
        for a in re.findall(r"`(results/version/[^`]+)`", text):
            if a not in archives:
                archives.append(a)
        all_cases, links = [], {}
        for a in archives:
            af = _load_archive_full(a)
            all_cases += af["cases"]
            for cid, m2 in af["links"].items():
                links.setdefault(cid, {}).update(m2)
        # 双 OS 归档去重：同一用例 (层级, ID) 取最差状态
        s_rank = {"FAIL": 0, "SPEC-MISMATCH": 1, "BLOCKED": 2, "NOT_RUN": 3, "PASS": 4, "": 5}
        seen = {}
        for c in all_cases:
            key = (c["level"], c["id"])
            if key not in seen or s_rank.get(c["status"], 5) < s_rank.get(seen[key]["status"], 5):
                seen[key] = c
        cases = list(seen.values())
        kpi = Counter()
        dims = {}
        dim_exec = {}
        expand_exec = {}
        for c in cases:
            kpi[c["status"]] += 1
            if c["level"] == "设计级":
                d = c["group"]
                d_info = dims.setdefault(d, {"count": 0, "prio": Counter()})
                d_info["count"] += 1
                d_info["prio"][c["prio"]] += 1
                dim_exec.setdefault(d, Counter())[c["status"]] += 1
            else:
                et = c["group"]
                expand_exec.setdefault(et, Counter())[c["status"]] += 1
        design = _fmt_counts(_stat_level(cases, "设计级"))
        expand = _fmt_counts(_stat_level(cases, "展开级"))
        design_stat = _stat_level(cases, "设计级")
        expand_stat = _stat_level(cases, "展开级")
        pass_rate = ""
        denom = kpi.get("PASS", 0) + kpi.get("FAIL", 0) + kpi.get("SPEC-MISMATCH", 0)
        if denom:
            pass_rate = f"{round(kpi.get('PASS', 0) / denom * 100, 1)}%"
        nums = set()
        for row in defect_rows:
            nums |= set(re.findall(r"#(\d+)", " ".join(row)))
        if nums:
            defect_short = "#" + ", #".join(sorted(nums, key=int, reverse=True))
        elif defect_rows:
            defect_short = "见详情"
        else:
            defect_short = "—"
        versions.append({
            "ver": name, "obj": obj, "design": design, "expand": expand,
            "design_stat": design_stat, "expand_stat": expand_stat,
            "pass_rate": pass_rate, "defect": defect_short,
            "tool": tool, "env": env, "defect_rows": defect_rows,
            "cases": cases, "kpi": dict(kpi), "dims": dims,
            "dim_exec": dict(dim_exec), "expand_exec": dict(expand_exec), "links": links,
        })
    return versions


def extract_case_ids(text):
    ids = set()
    for m in re.findall(r"[Dd]\s*\d{1,2}\s*[-–—]\s*[A-Za-z0-9][A-Za-z0-9-]*", text or ""):
        ids.add(re.sub(r"\s+", "", m).upper())
    for m in re.findall(r"EXP-[A-Z0-9-]+", (text or "").upper()):
        ids.add(m.rstrip("-"))
    return ids


def load_issue_trend(dates):
    """按日期统计各客户端 HISTORY_LINKS 中 open/closed 去重 issue 数量。"""
    trend = []
    results_dir = os.path.join(REPO, "results")
    if not os.path.isdir(results_dir):
        return trend
    for date in dates:
        open_set, closed_set = set(), set()
        for client in sorted(os.listdir(results_dir)):
            if client in ("Summary", "Regression", "version", "history"):
                continue
            cdir = os.path.join(results_dir, client)
            if not os.path.isdir(cdir):
                continue
            for sub in sorted(os.listdir(cdir)):
                if not sub.startswith(date + "-"):
                    continue
                for osn in ("Windows", "Linux"):
                    fp = os.path.join(cdir, sub, osn, "HISTORY_LINKS.md")
                    if not os.path.isfile(fp):
                        continue
                    for smap in _parse_history_links(open(fp, encoding="utf-8").read()).values():
                        for num, st in smap.items():
                            (open_set if st == "open" else closed_set).add(num)
        trend.append({"date": date, "open": len(open_set), "closed": len(closed_set)})
    return trend


def _parse_history_links(text):
    """解析单份 HISTORY_LINKS.md -> {用例ID: {issue号: state}}。"""
    links = {}
    current = None
    for line in text.split("\n"):
        m = re.match(r"^## (.+)$", line)
        if m:
            current = extract_case_ids(m.group(1))
            for cid in current:
                links.setdefault(cid, {})
            continue
        m2 = re.match(r"\s*-\s*\[#(\d+)\]\([^)]*\)（(open|closed)）", line, re.I)
        if m2 and current:
            num, state = int(m2.group(1)), m2.group(2).lower()
            for cid in current:
                links[cid][num] = state
    return {k: dict(sorted(v.items(), reverse=True)) for k, v in links.items()}


def load_issue_links(dates):
    """从各客户端 HISTORY_LINKS.md 解析 用例ID -> {issue号: state} 映射（最近日期）。"""
    links = {}
    date_scope = set(dates[-3:])
    results_dir = os.path.join(REPO, "results")
    if not os.path.isdir(results_dir):
        return links
    for client in sorted(os.listdir(results_dir)):
        if client in ("Summary", "Regression", "version", "history"):
            continue
        cdir = os.path.join(results_dir, client)
        if not os.path.isdir(cdir):
            continue
        for sub in sorted(os.listdir(cdir)):
            if not any(sub.startswith(d + "-") or sub == d for d in date_scope):
                continue
            for os_name in ("Windows", "Linux"):
                fp = os.path.join(cdir, sub, os_name, "HISTORY_LINKS.md")
                if not os.path.isfile(fp):
                    continue
                for cid, m2 in _parse_history_links(open(fp, encoding="utf-8").read()).items():
                    links.setdefault(cid, {}).update(m2)
    return links


def load_defect_notes(dates):
    """从 FINDINGS.md 解析 用例ID -> 不提单原因（测试侧/非产品缺陷/暂不提单）。"""
    notes = {}
    date_scope = set(dates[-3:])
    results_dir = os.path.join(REPO, "results")
    if not os.path.isdir(results_dir):
        return notes
    for client in sorted(os.listdir(results_dir)):
        if client in ("Summary", "Regression", "version", "history"):
            continue
        cdir = os.path.join(results_dir, client)
        if not os.path.isdir(cdir):
            continue
        for sub in sorted(os.listdir(cdir)):
            if not any(sub.startswith(d + "-") or sub == d for d in date_scope):
                continue
            for os_name in ("Windows", "Linux"):
                fp = os.path.join(cdir, sub, os_name, "FINDINGS.md")
                if not os.path.isfile(fp):
                    continue
                text = open(fp, encoding="utf-8").read()
                for m in re.finditer(r"^## #\d+【([^】]+)】(.+)$", text, re.M):
                    sev = m.group(1).strip()
                    title = m.group(2).strip()
                    ids = extract_case_ids(title)
                    if not ids:
                        continue
                    reason = None
                    if "测试侧" in sev:
                        reason = "测试侧"
                    elif re.search(r"非产品缺陷|不予提单", sev):
                        reason = "非产品缺陷"
                    else:
                        seg = text[m.end():]
                        nxt = re.search(r"^## ", seg, re.M)
                        seg = seg[:nxt.start()] if nxt else seg
                        ms = re.search(r"[-*]\s*\*\*状态[^*]*\*\*[：:]\s*(.+)", seg)
                        status = ms.group(1).strip() if ms else ""
                        if re.search(r"暂不提单|暂缓|搁置", status):
                            reason = "暂不提单"
                        elif re.search(r"待提单|待提|未提单|本轮新增", status):
                            reason = "待提单"
                    if reason:
                        for cid in ids:
                            notes.setdefault(cid, set()).add(reason)
    return {k: sorted(v) for k, v in notes.items()}


def load_bench():
    """从 skill-bench/results/summary.json 读取技能评测基线汇总（脱敏看板数据源）。"""
    import json
    p = os.path.join(REPO, "skill-bench", "results", "summary.json")
    if not os.path.exists(p):
        return None
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def load_ux_special():
    """UX（D11）体验专项执行态：读 results/UX专项/UX专项-<日期>.json 中最新一份。

    该 JSON 由 scripts/gen_ux_special.py 调用 eval/harness/fixtures/run-ux.mjs 生成
    （夹具内置宿主隔离 + 需求验收三态退出码）；本看板只读不重算，保持单一真源。
    """
    import json
    if not os.path.isdir(UX_DIR):
        return None
    cands = sorted(f for f in os.listdir(UX_DIR)
                   if f.startswith("UX专项-") and f.endswith(".json"))
    if not cands:
        return None
    p = os.path.join(UX_DIR, cands[-1])
    try:
        with open(p, encoding="utf-8") as f:
            doc = json.load(f)
    except Exception:
        return None
    doc["_file"] = os.path.relpath(p, REPO).replace("\\", "/")
    return doc


def load_ux_design():
    """UX 用例设计态概览：读 test-cases/ux/用例矩阵-体验级.csv（唯一真源 = 同目录 gen_ux.py）。"""
    if not os.path.isfile(UX_CSV):
        return None
    try:
        with open(UX_CSV, encoding="utf-8-sig", newline="") as f:
            rows = list(csv.DictReader(f))
    except Exception:
        return None
    if not rows:
        return None

    def num(cid):
        m = re.search(r"-(\d+)$", cid or "")
        return int(m.group(1)) if m else 0

    def prio(r, want):
        return (r.get("优先级") or "").strip() == want

    def frozen(r):
        return "契约依赖" in (r.get("依赖") or "")

    # 夹具 ↔ 用例 的权威映射：取自 CSV「自动化建议」列的 `fixture:<路径>`（真源仍是 gen_ux.py）
    fixture_map = {}
    for r in rows:
        for m in re.finditer(r"fixture:([^\s,;]+)", (r.get("自动化建议") or "")):
            fixture_map[os.path.basename(m.group(1))] = r.get("ID", "")

    def batch_of(n):
        return "第一批 · 登录体验" if n <= 21 else ("第二批 · 使用体验" if n <= 35 else "第三批 · 范式升级")

    # 批次概览（区间按实际存在的 ID 求，避免硬编码漂移）
    out = []
    for name, lo, hi in [("第一批 · 登录体验", 1, 21), ("第二批 · 使用体验", 22, 35),
                         ("第三批 · 范式升级", 36, 10 ** 6)]:
        grp = [r for r in rows if lo <= num(r.get("ID", "")) <= hi]
        nums = sorted(num(r.get("ID", "")) for r in grp)
        out.append({
            "name": name,
            "range": f"D11-{nums[0]} ~ D11-{nums[-1]}" if nums else "—",
            "total": len(grp),
            "p1": sum(1 for r in grp if prio(r, "P1")),
            "p2": sum(1 for r in grp if prio(r, "P2")),
            "frozen": sum(1 for r in grp if frozen(r)),
        })

    def block_of(r):
        m = re.search(r"<阻塞:\s*([^>|]+)", r.get("展开规则") or "")
        return m.group(1).strip() if m else ""

    # 全量用例清单（43 条，含未建载体的）：看板要把每条用例都体现出来
    cases = []
    for r in rows:
        cid = (r.get("ID") or "").strip()
        advice = (r.get("自动化建议") or "").strip()
        fm = re.search(r"fixture:([^\s,;]+)", advice)
        dep = (r.get("依赖") or "").strip()
        cases.append({
            "id": cid,
            "title": (r.get("标题") or "").strip(),
            "prio": (r.get("优先级") or "").strip(),
            "batch": batch_of(num(cid)),
            "advice": advice.split(":")[0].strip() if advice else "",
            "fixture": os.path.basename(fm.group(1)) if fm else "",
            "landed": bool(fm),
            "frozen": "契约依赖" in dep,
            "dep": dep,
            "block": block_of(r),
        })
    return {
        "total": len(rows),
        "p1": sum(1 for r in rows if prio(r, "P1")),
        "p2": sum(1 for r in rows if prio(r, "P2")),
        "frozen": sum(1 for r in rows if frozen(r)),
        "carrier": {
            "landed": sum(1 for c in cases if c["landed"]),
            "frozen_only": sum(1 for c in cases if c["frozen"] and not c["landed"]),
            "none": sum(1 for c in cases if not c["frozen"] and not c["landed"]),
        },
        "batches": out,
        "fixture_map": fixture_map,
        "cases": cases,
        "source": os.path.relpath(UX_CSV, REPO).replace("\\", "/"),
    }


UX_STATUS_COLOR = {"PASS": "#2ecc71", "NOT_IMPLEMENTED": "#e74c3c", "BLOCKED": "#f39c12"}
UX_STATUS_LABEL = {"PASS": "PASS", "NOT_IMPLEMENTED": "需求未实现", "BLOCKED": "BLOCKED(ENV)"}
_TD = 'padding:6px 8px;border:1px solid #ddd;'
_TH = 'padding:6px 8px;border:1px solid #ddd;background:#f2f2f2;'


def _ux_kpi(value, label, color):
    return (f'<div style="flex:1;min-width:110px;background:{color};color:#fff;border-radius:8px;'
            f'padding:14px 10px;text-align:center;margin:4px;">'
            f'<div style="font-size:24px;font-weight:700;">{value}</div>'
            f'<div style="font-size:12px;opacity:.9;">{label}</div></div>')


def render_ux_block(ux, design):
    """渲染「UX 专项」页签：门禁三态矩阵 + 失败断言明细 + 用例设计态概览。"""
    if not ux:
        return ('<p style="color:#95a5a6;">暂无 UX（D11）体验专项数据。生成方式：'
                '<code>python scripts/gen_ux_special.py --sut "&lt;标签&gt;=&lt;plugins/huaweicloud-core/src&gt;"</code></p>')

    suts = ux.get("suts", [])
    cases = [c for c in (suts[0].get("cases") if suts else []) or []]
    main = suts[0] if suts else {}
    msum = main.get("summary", {}) or {}

    parts = ['<h2>UX（D11）体验专项 · 可执行门禁</h2>']
    parts.append(
        '<p style="color:#7f8c8d;font-size:12px;">数据源 <code>' + ux.get("_file", "") +
        '</code>（由 <code>scripts/gen_ux_special.py</code> 跑 <code>eval/harness/fixtures/run-ux.mjs</code> 生成：'
        '夹具内置宿主隔离 + 需求验收三态退出码）；数据日期 <b>' + str(ux.get("date", "—")) +
        '</b>，生成于 ' + str(ux.get("generatedAt", "—")) + '（' + str(ux.get("timezone", "Asia/Shanghai")) + '）。</p>')

    # KPI
    k = _ux_kpi(design["total"] if design else len(cases), "D11 用例总数", "#34495e")
    if design:
        k += _ux_kpi(f'{design["p1"]} / {design["p2"]}', "P1 / P2", "#8e44ad")
        k += _ux_kpi(design["carrier"]["landed"], "已建可执行载体", "#16a085")
        k += _ux_kpi(design["carrier"]["frozen_only"], "契约依赖待冻结", "#e67e22")
        k += _ux_kpi(design["carrier"]["none"], "未建可执行载体", "#95a5a6")
    k += _ux_kpi(f'{msum.get("pass", 0)} / {msum.get("total", len(cases))}', "主列 PASS / 总数", "#3498db")
    k += _ux_kpi(msum.get("not_implemented", 0), "需求未实现", UX_STATUS_COLOR["NOT_IMPLEMENTED"])
    k += _ux_kpi(msum.get("blocked", 0), "BLOCKED(ENV)", UX_STATUS_COLOR["BLOCKED"])
    parts.append(f'<div style="display:flex;flex-wrap:wrap;margin:-4px;">{k}</div>')

    # 口径声明
    parts.append(
        '<div style="background:#fdf6e3;border-left:4px solid #e67e22;padding:8px 12px;margin:10px 0;font-size:12px;color:#7f5f00;">'
        '<b>口径（必读）</b>：' + str(ux.get("caveat", "")) +
        ' 因此「需求未实现」<b>不是</b> harness 故障，也不等于体验验收结论。</div>')

    # 三态矩阵
    parts.append('<h3>门禁三态矩阵（列 = 被测包）</h3>')
    head = ('<tr>' + f'<th style="{_TH}">用例</th><th style="{_TH}">夹具</th>'
            + ''.join(f'<th style="{_TH}">' +
                      f'{s.get("label", "")}<br><span style="font-weight:400;color:#7f8c8d;">v{s.get("version") or "?"}</span>'
                      f'</th>' for s in suts) + '</tr>')
    rows = []
    fmap = (design or {}).get("fixture_map", {})
    for c in cases:
        fname = c.get("file", "")
        own_id = c.get("case", "")
        matrix_id = fmap.get(fname, "")
        label_id = matrix_id or own_id or "—"
        sub = (f'<br><span style="color:#e67e22;font-size:10px;">夹具自标 {own_id}</span>'
               if matrix_id and own_id and matrix_id != own_id else '')
        recs = {s["label"]: next((x for x in s.get("cases", []) if x.get("case") == c.get("case")), None) for s in suts}
        tds = []
        for s in suts:
            r = recs.get(s.get("label"))
            if not r:
                tds.append(f'<td style="{_TD}text-align:center;color:#95a5a6;">—</td>')
                continue
            st = r.get("status", "")
            tot = (r.get("pass") or 0) + (r.get("fail") or 0)
            tds.append(f'<td style="{_TD}text-align:center;color:{UX_STATUS_COLOR.get(st, "#2c3e50")};">'
                       f'<b>{UX_STATUS_LABEL.get(st, st)}</b><br><span style="color:#7f8c8d;">'
                       f'{(r.get("pass") if r.get("pass") is not None else "?")}/{tot or "?"} 断言</span></td>')
        rows.append(f'<tr><td style="{_TD}"><b>{label_id}</b>{sub}</td>'
                    f'<td style="{_TD}color:#7f8c8d;font-size:11px;">{fname}</td>' + ''.join(tds) + '</tr>')
    parts.append('<table style="border-collapse:collapse;width:100%;font-size:12px;">'
                 f'<thead>{head}</thead><tbody>{"".join(rows)}</tbody></table>')
    parts.append('<p style="color:#7f8c8d;font-size:12px;">单元格 = 三态判定 ｜ 通过/全部断言数。'
                 '「需求未实现」= 需求验收未达标（已知缺口）；BLOCKED(ENV) = 宿主/环境不可判定。'
                 '用例 ID 以设计矩阵（<code>test-cases/ux/</code>，真源 <code>gen_ux.py</code>）为准；'
                 '夹具文件名/内部 case id 与用例号不一致处标注为橙色「夹具自标」。</p>')

    # ---- 全量用例清单（43 条：已建载体的给三态结果，未建载体的也逐条列出）----
    if design and design.get("cases"):
        stat = {}
        for s in suts:
            for c in s.get("cases", []):
                stat.setdefault(c.get("case"), {})[s.get("label")] = c
        main_label = main.get("label")
        urows, cnt = [], Counter()
        for c in design["cases"]:
            per = stat.get(c["id"], {})
            mr = per.get(main_label) or (next(iter(per.values())) if per else None)
            if per:
                kind = "PASS" if (mr or {}).get("status") == "PASS" else "FAIL"
            elif c["frozen"]:
                kind = "FROZEN"
            else:
                kind = "NONE"
            cnt[kind] += 1
            tds = []
            for s in suts:
                rr = per.get(s.get("label"))
                if not rr:
                    tds.append(f'<td style="{_TD}text-align:center;color:#bdc3c7;">—</td>')
                    continue
                st = rr.get("status", "")
                tot = (rr.get("pass") or 0) + (rr.get("fail") or 0)
                tds.append(f'<td style="{_TD}text-align:center;color:{UX_STATUS_COLOR.get(st, "#2c3e50")};">'
                           f'<b>{UX_STATUS_LABEL.get(st, st)}</b>'
                           f'<br><span style="color:#7f8c8d;">{rr.get("pass")}/{tot or "?"}</span></td>')
            if c["fixture"]:
                carrier = f'夹具 <code>{c["fixture"]}</code>'
            else:
                carrier = f'{c["advice"] or "—"}（纸面定义）'
            notes = []
            if c["frozen"]:
                notes.append('<span style="color:#e67e22;">契约依赖待冻结</span>')
            if c["block"] and c["block"] != "无":
                notes.append(c["block"])
            note = ' ｜ '.join(notes)
            stripe = ' style="background:#fbfbfb;"' if len(urows) % 2 else ''
            urows.append(
                f'<tr class="uxrow" data-ux="{kind}"{stripe}>'
                f'<td style="{_TD}white-space:nowrap;"><b>{c["id"]}</b></td>'
                f'<td style="{_TD}text-align:center;">{c["prio"]}</td>'
                f'<td style="{_TD}color:#7f8c8d;font-size:11px;white-space:nowrap;">{c["batch"].split(" · ")[0]}</td>'
                f'<td style="{_TD}">{c["title"]}</td>'
                f'<td style="{_TD}color:#7f8c8d;font-size:11px;">{carrier}</td>'
                + ''.join(tds)
                + f'<td style="{_TD}color:#7f8c8d;font-size:11px;">{note}</td></tr>')
        parts.append(
            f'<h3>全部 D11 用例（{design["total"]} 条 · 每条都列出）</h3>'
            '<p style="color:#7f8c8d;font-size:12px;">执行态列 = 该用例的门禁结果（未建载体者该列标 '
            '<b>—</b>，不计入通过率）。载体列「纸面定义」= 目前只有用例定义、尚未落 L1/L2 可执行载体；'
            '「契约依赖待冻结」= 依赖字段未冻结，契约冻结前应标 NOT_RUN。</p>'
            '<div style="margin:0 0 8px;">'
            f'<button class="uxbtn active" data-f="ALL" onclick="filterUxCase(\'ALL\')">全部 {design["total"]}</button>'
            f'<button class="uxbtn" data-f="PASS" onclick="filterUxCase(\'PASS\')">PASS {cnt["PASS"]}</button>'
            f'<button class="uxbtn" data-f="FAIL" onclick="filterUxCase(\'FAIL\')">需求未实现 {cnt["FAIL"]}</button>'
            f'<button class="uxbtn" data-f="FROZEN" onclick="filterUxCase(\'FROZEN\')">契约待冻结 {cnt["FROZEN"]}</button>'
            f'<button class="uxbtn" data-f="NONE" onclick="filterUxCase(\'NONE\')">未建载体 {cnt["NONE"]}</button>'
            '</div>'
            '<table style="border-collapse:collapse;width:100%;font-size:12px;">'
            f'<thead><tr><th style="{_TH}">用例</th><th style="{_TH}">P</th><th style="{_TH}">批次</th>'
            f'<th style="{_TH}">标题</th><th style="{_TH}">载体</th>'
            + ''.join(f'<th style="{_TH}">{s.get("label", "")}</th>' for s in suts)
            + f'<th style="{_TH}">阻塞 / 依赖</th></tr></thead>'
            f'<tbody>{"".join(urows)}</tbody></table>')
        parts.append(
            f'<p style="color:#7f8c8d;font-size:12px;">载体分布：已建可执行夹具 <b>{cnt["PASS"] + cnt["FAIL"]}</b> 条 ｜ '
            f'契约依赖待冻结（无载体）<b>{cnt["FROZEN"]}</b> 条 ｜ 未建可执行载体 '
            f'<b>{cnt["NONE"]}</b> 条（纸面定义，需评审后决定是否落载体）。'
            '已落载体且契约未冻结的用例按「门禁先行」执行，结果如实计为需求未实现、仅记趋势，'
            '待契约冻结后才作正式契约验收。</p>')

    # 失败断言明细
    parts.append('<h3>失败断言明细（逐条 actual / expected）</h3>')
    for s in suts:
        fails = [(c, a) for c in s.get("cases", []) for a in (c.get("assertions") or []) if not a.get("ok")]
        if not fails:
            parts.append(f'<details style="margin:6px 0;"><summary style="cursor:pointer;font-size:13px;">'
                         f'{s.get("label")}（v{s.get("version") or "?"}）—— 无失败断言</summary></details>')
            continue
        frows = ''.join(
            f'<tr><td style="{_TD}"><b>{a.get("id", "")}</b></td>'
            f'<td style="{_TD}">{a.get("title", "")}</td>'
            f'<td style="{_TD}font-family:Consolas,monospace;font-size:11px;color:#c0392b;">{str(a.get("actual"))[:160]}</td>'
            f'<td style="{_TD}font-family:Consolas,monospace;font-size:11px;color:#27ae60;">{str(a.get("expected"))[:160]}</td>'
            f'<td style="{_TD}font-size:11px;color:#7f8c8d;">{a.get("detail", "")}</td></tr>'
            for _c, a in fails)
        parts.append(
            f'<details style="margin:6px 0;"><summary style="cursor:pointer;padding:8px 12px;background:#f7f7f7;'
            f'border-radius:6px;font-size:13px;font-weight:700;">{s.get("label")}（v{s.get("version") or "?"}）'
            f'—— {len(fails)} 条失败断言</summary>'
            '<table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:6px;">'
            f'<thead><tr><th style="{_TH}">断言</th><th style="{_TH}">标题</th>'
            f'<th style="{_TH}">actual</th><th style="{_TH}">expected</th><th style="{_TH}">说明</th></tr></thead>'
            f'<tbody>{frows}</tbody></table></details>')

    # 设计态概览
    if design:
        drows = ''.join(
            f'<tr><td style="{_TD}">{b["name"]}</td><td style="{_TD}text-align:center;">{b["range"]}</td>'
            f'<td style="{_TD}text-align:center;">{b["total"]}</td>'
            f'<td style="{_TD}text-align:center;">{b["p1"]}</td>'
            f'<td style="{_TD}text-align:center;">{b["p2"]}</td>'
            f'<td style="{_TD}text-align:center;">{b["frozen"]}</td></tr>'
            for b in design["batches"])
        parts.append(
            f'<h3>用例设计态概览（共 {design["total"]} 条，P1 {design["p1"]} / P2 {design["p2"]}）</h3>'
            f'<p style="color:#7f8c8d;font-size:12px;">数据源 <code>{design["source"]}</code>（唯一真源 = 同目录 <code>gen_ux.py</code>；'
            '本表不含执行态，执行态见上方门禁矩阵）。</p>'
            '<table style="border-collapse:collapse;width:100%;font-size:13px;">'
            f'<thead><tr><th style="{_TH}text-align:left;">批次</th><th style="{_TH}">ID 区间</th>'
            f'<th style="{_TH}">条数</th><th style="{_TH}">P1</th><th style="{_TH}">P2</th>'
            f'<th style="{_TH}">契约依赖待冻结</th></tr></thead>'
            f'<tbody>{drows}</tbody></table>')
        parts.append(
            f'<p style="color:#7f8c8d;font-size:12px;">三类体验<b>无法用断言覆盖</b>、需人工 rubric：认知负荷、'
            f'错误文案是否够新手用、视觉排版。另：{design["frozen"]} 条用例带「契约依赖…待冻结」，'
            '契约冻结前应标 NOT_RUN，不得以「设计完整」冒充「已通过」。</p>')

    parts.append('<p style="color:#95a5a6;font-size:11px;">复跑：<code>python scripts/gen_ux_special.py '
                 '--sut "&lt;标签&gt;=&lt;plugins/huaweicloud-core/src&gt;"</code> 生成同一数据源后本页自动刷新；'
                 'exit 0 = 全部通过（需求已实现）/ 1 = 需求未实现 / 2 = 环境不可判定。</p>')
    return ''.join(parts)


def render(days, version, vdate, gen_ts, links, notes, versions):
    latest_date = days[-1]["date"]
    latest_sum = days[-1]["summary"]

    # 最新日明细（客户端/维度/缺陷）用 CSV 复用 report_html 口径
    latest_rows = R.load_summary(latest_date)
    latest_cmp = R._compute(latest_rows, [], latest_date, "?")

    # ---- KPI 卡片（直接取最新报告执行摘要） ----
    def kpi(value, label, color):
        return (f'<div style="flex:1;min-width:120px;background:{color};color:#fff;border-radius:8px;'
                f'padding:16px 12px;text-align:center;margin:4px;">'
                f'<div style="font-size:28px;font-weight:700;">{value}</div>'
                f'<div style="font-size:13px;opacity:.9;">{label}</div></div>')

    kpis = (kpi(latest_sum["total"], "总用例", "#34495e")
            + kpi(latest_sum["pass"], "PASS", STATUS_COLOR["PASS"])
            + kpi(latest_sum["fail"], "FAIL", STATUS_COLOR["FAIL"])
            + kpi(latest_sum["blocked"], "BLOCKED", STATUS_COLOR["BLOCKED"])
            + kpi(latest_sum["rate"], "通过率", "#3498db"))

    # ---- 每日执行趋势（按月份分组展开显示） ----
    daily_head = '<tr style="background:#f2f2f2;">' + ''.join(
        f'<th style="padding:6px 8px;border:1px solid #ddd;">{h}</th>'
        for h in ["日期", "总用例"] + STATUS_ORDER + ["通过率", ""]) + '</tr>'
    summary_fields = {"PASS": "pass", "FAIL": "fail", "BLOCKED": "blocked",
                      "SPEC-MISMATCH": "spec", "NOT_RUN": "not_run"}

    def _day_row(d):
        s = d["summary"]
        pct = rate_num(s["rate"])
        bar = (f'<div style="height:8px;background:#eee;border-radius:4px;width:120px;margin-left:auto;">'
               f'<div style="height:8px;width:{pct}%;background:#3498db;border-radius:4px;"></div></div>')
        return ('<tr><td style="padding:6px 8px;border:1px solid #ddd;white-space:nowrap;"><b>'
                + d["date"][5:] + '</b></td><td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">'
                + str(s["total"]) + '</td>'
                + ''.join(f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;color:{STATUS_COLOR[k]}">'
                          f'{s[summary_fields[k]]}</td>' for k in STATUS_ORDER)
                + f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;"><b>{s["rate"]}</b></td>'
                + f'<td style="padding:6px 8px;border:1px solid #ddd;">{bar}</td></tr>')

    # 按月份分组（最新月份在前，月内按日期倒序）
    by_month, month_order = {}, []
    for d in days:
        m = d["date"][:7]
        if m not in by_month:
            by_month[m] = []
            month_order.append(m)
        by_month[m].append(d)
    month_order.sort(reverse=True)
    daily_blocks = ""
    for i, m in enumerate(month_order):
        mdays = by_month[m]
        n_days = len(mdays)
        avg_rate = sum(rate_num(x["summary"]["rate"]) for x in mdays) / n_days
        y, mo = m.split("-")
        open_attr = " open" if i == 0 else ""
        mrows = "".join(_day_row(d) for d in reversed(mdays))
        daily_blocks += (
            f'<details style="border:1px solid #ddd;border-radius:6px;margin:10px 0;"{open_attr}>'
            f'<summary style="cursor:pointer;padding:10px 14px;font-size:14px;font-weight:700;background:#f7f7f7;border-radius:6px;">'
            f'{y} 年 {int(mo)} 月 <span style="color:#7f8c8d;font-weight:400;font-size:12px;">· {n_days} 天 · 平均通过率 {avg_rate:.1f}%</span>'
            f'</summary><table style="border-collapse:collapse;width:100%;font-size:13px;margin-top:6px;">'
            f'<thead>{daily_head}</thead><tbody>{mrows}</tbody></table></details>')

    # ---- 通过率折线 SVG ----
    def sparkline(values, color="#3498db", height=140, width=560, pct=True):
        if len(values) < 2:
            return ""
        w_pad, h_pad = 12, 18
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
        suffix = "%" if pct else ""

        def fv(v):
            f = float(v)
            return str(int(f)) if f == int(f) else str(v)

        dots = "".join(f'<circle cx="{x}" cy="{y}" r="3" fill="{color}"><title>{fv(values[i])}{suffix}</title></circle>'
                       for i, (x, y) in enumerate(pts))
        labels = "".join(f'<text x="{x}" y="{y-6}" font-size="11" font-weight="bold" text-anchor="middle" fill="#34495e">{fv(values[i])}{suffix}</text>'
                         for i, (x, y) in enumerate(pts))
        return (f'<svg viewBox="0 0 {width} {height}" style="width:100%;max-width:{width}px;height:auto;">'
                f'<polyline points="{line}" fill="none" stroke="{color}" stroke-width="2"/>'
                f'{dots}{labels}</svg>')

    rate_vals = [rate_num(d["summary"]["rate"]) for d in days]

    # ---- 每日 open issue 趋势 ----
    issue_trend = load_issue_trend([d["date"] for d in days])
    it_vals = [x["open"] for x in issue_trend]
    it_label = " · ".join(f'{x["date"][5:]}: {x["open"]}' for x in issue_trend if x["open"] or x["closed"])

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
    for cl in latest_cmp["clients"]:
        ex, p, f, b, s, nr, uf = cl["row"]
        badge = f'<span style="display:inline-block;padding:2px 8px;border-radius:3px;color:#fff;background:{COLOR.get(cl["st_text"],"#95a5a6")}">{cl["st_text"]}</span>'
        client_rows += ('<tr>' + f'<td style="padding:6px 8px;border:1px solid #ddd;"><b>{cl["client"]}</b></td>'
                        + f'<td style="padding:6px 8px;border:1px solid #ddd;">{badge}</td>'
                        + ''.join(f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{v}</td>'
                                  for v in (cl["should"], ex, cl["exec_rate"], cl["pass_rate"], p, f, b, s)) + '</tr>')
    client_overview = (f'共 <b>{len(R.ALL_CLIENTS)}</b> 个智能体：已执行 <b>{latest_cmp["executed"]}</b>，'
                       f'已建包未回填 <b>{latest_cmp["pkg_only"]}</b>，未执行 <b>{latest_cmp["notrun"]}</b>。')

    # ---- 缺陷存量（最新日，按优先级对 FAIL 用例计数） ----
    def case_status(rows):
        cols = [c for c in rows[0].keys() if c not in R.META] if rows else []
        return {r.get("ID"): R._case_status(cols, r) for r in rows}

    st_map = case_status(latest_rows)
    prio_fail = Counter()
    fail_list = []
    for r in latest_rows:
        if st_map.get(r.get("ID")) != "FAIL":
            continue
        prio = (r.get("优先级") or "(空)").strip()
        prio_fail[prio] += 1
        cid = r.get("ID", "")
        src = (r.get("源用例") or cid or "").strip() or cid
        fail_list.append((prio, cid, R._case_title(r), src))
    fail_list.sort(key=lambda x: ({"P0": 0, "P1": 1, "P2": 2}.get(x[0], 9), x[1]))

    def issue_cell(cid, src):
        linkmap = links.get(cid) or links.get(src) or {}
        if not linkmap:
            reasons = sorted(set(notes.get(cid) or []) | set(notes.get(src) or []))
            if reasons:
                label = " / ".join(reasons)
                return f'<span style="color:#95a5a6;font-size:11px;">{label}</span>'
            return '<span style="color:#bdc3c7;">—</span>'
        nums = sorted(linkmap, reverse=True)
        shown = nums[:3]
        parts = []
        for n in shown:
            state = linkmap.get(n, "open")
            color = "#27ae60" if state == "open" else "#95a5a6"
            parts.append(
                f'<a href="https://github.com/huaweicloud/huaweicloud-devkit/issues/{n}" '
                f'style="color:#2980b9;text-decoration:none;">#{n}</a>'
                f'<span title="{state}" style="color:{color};font-size:10px;">●</span>')
        text = " ".join(parts)
        if len(nums) > 3:
            open_cnt = sum(1 for n in nums if linkmap.get(n) == "open")
            text += f' <span style="color:#95a5a6;">等 {len(nums)} 个（open {open_cnt}）</span>'
        return text

    prio_order = ["P0", "P1", "P2"]
    prio_kpi = "".join(
        kpi(prio_fail.get(p, 0), f"{p} 存量", {"P0": "#c0392b", "P1": "#e67e22", "P2": "#2980b9"}.get(p, "#7f8c8d"))
        for p in prio_order)

    fail_rows = "".join(
        f'<tr><td style="padding:6px 8px;border:1px solid #ddd;"><b style="color:{ {"P0":"#c0392b","P1":"#e67e22","P2":"#2980b9"}.get(pr,"#333") }">{pr}</b></td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;">{cid}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:left;">{t}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:left;font-size:12px;">{issue_cell(cid, src)}</td></tr>'
        for pr, cid, t, src in fail_list) or '<tr><td colspan="4" style="color:#95a5a6;padding:6px;">无 FAIL 用例</td></tr>'

    # ---- 维度分布（最新日） ----
    dim_rows = "".join(
        f'<tr><td style="padding:6px 8px;border:1px solid #ddd;"><b>{x["dim"]}</b></td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{x["count"]}</td>'
        + ''.join(f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{v}</td>' for v in x["prio"])
        + '</tr>' for x in latest_cmp["dim_order"])

    # ---- 用例执行明细（最新日） ----
    case_client_cols = [c for c in latest_rows[0].keys() if c not in R.META] if latest_rows else []
    S_RANK = {"FAIL": 0, "SPEC-MISMATCH": 1, "BLOCKED": 2, "NOT_RUN": 3, "PASS": 4}
    S_DOT = {"PASS": "#2ecc71", "FAIL": "#e74c3c", "BLOCKED": "#f39c12", "SPEC-MISMATCH": "#e67e22", "NOT_RUN": "#bdc3c7"}
    case_detail_rows = []
    for r in latest_rows:
        cid = r.get("ID", "")
        level = r.get("层级", "")
        dim = (r.get("维度") or "").strip() if level == "设计级" else (r.get("展开类型") or "").strip()
        prio = (r.get("优先级") or "").strip()
        title = R._case_title(r)
        src = (r.get("源用例") or cid or "").strip() or cid
        agent_st = {}
        for a in R.ALL_CLIENTS:
            a_cols = [c for c in case_client_cols if c.split("-")[0] == a]
            vals = {(r.get(c) or "").strip() for c in a_cols} - {"NA", ""}
            if vals:
                agent_st[a] = next((k for k in ("FAIL", "SPEC-MISMATCH", "BLOCKED", "NOT_RUN", "PASS") if k in vals), "NOT_RUN")
        overall = next((k for k in ("FAIL", "SPEC-MISMATCH", "BLOCKED", "NOT_RUN", "PASS") if k in agent_st.values()), "NOT_RUN")
        case_detail_rows.append((overall, cid, dim, prio, title, src, agent_st))
    case_detail_rows.sort(key=lambda x: (S_RANK.get(x[0], 9), x[1]))
    case_rows = ""
    for overall, cid, dim, prio, title, src, agent_st in case_detail_rows:
        dots = "".join(
            f'<span title="{a}: {agent_st.get(a, "—")}" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:{S_DOT.get(agent_st.get(a, ""), "#dfe3e8")};margin:0 1px;"></span>'
            for a in R.ALL_CLIENTS)
        iss = issue_cell(cid, src) if overall in ("FAIL", "SPEC-MISMATCH", "BLOCKED") else ""
        case_rows += (
            f'<tr class="caserow" data-st="{overall}">'
            f'<td style="padding:4px 8px;border:1px solid #eee;"><span style="display:inline-block;padding:1px 8px;border-radius:3px;color:#fff;background:{STATUS_COLOR.get(overall, "#95a5a6")};">{overall}</span></td>'
            f'<td style="padding:4px 8px;border:1px solid #eee;"><b>{cid}</b></td>'
            f'<td style="padding:4px 8px;border:1px solid #eee;white-space:nowrap;color:#7f8c8d;">{dim}</td>'
            f'<td style="padding:4px 8px;border:1px solid #eee;text-align:center;">{prio}</td>'
            f'<td style="padding:4px 8px;border:1px solid #eee;text-align:left;">{title}</td>'
            f'<td style="padding:4px 8px;border:1px solid #eee;white-space:nowrap;">{dots}</td>'
            f'<td style="padding:4px 8px;border:1px solid #eee;white-space:nowrap;">{iss}</td></tr>')

    # ---- 版本全量测试 ----
    V_ST = [("PASS", "PASS"), ("FAIL", "FAIL"), ("BLOCKED", "BLOCKED"), ("SPEC-MISMATCH", "SPEC"), ("NOT_RUN", "NOT_RUN")]

    def _stat_cells(stat):
        return ''.join(
            ('<td style="padding:6px 4px;border:1px solid #ddd;text-align:center;color:' + (STATUS_COLOR.get(k, "#333") if stat.get(k) else "#bdc3c7") + ';">' + (str(stat.get(k)) if stat.get(k) else "—") + '</td>')
            for k, _ in V_ST)

    version_rows = "".join(
        f'<tr><td style="padding:6px 8px;border:1px solid #ddd;"><b>{v["ver"]}</b></td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;" title="{v["obj"]}">{v["obj"][:24] if v["obj"] else "—"}</td>'
        f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;"><b style="font-size:15px;">{sum(v["kpi"].values()) if v["kpi"] else (len(v["cases"]) or "—")}</b></td>'
        + _stat_cells(v["design_stat"])
        + _stat_cells(v["expand_stat"])
        + f'<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;"><b>{v["pass_rate"] or "—"}</b></td>'
        + f'<td style="padding:6px 8px;border:1px solid #ddd;">{v["defect"]}</td></tr>'
        for v in versions) or '<tr><td colspan="13" style="color:#95a5a6;padding:6px;">暂无版本全量测试记录</td></tr>'

    version_detail = ""
    V_DIM_ORDER = ["D1安装", "D2认证", "D3功能", "D4安全", "D5客户端", "D6性能", "D7兼容", "D8质量", "D9协议", "D10评测"]
    for v in versions:
        def v_issue(case_text):
            smap = {}
            for cid in extract_case_ids(case_text):
                smap.update(v["links"].get(cid, {}))
            if not smap:
                return '<span style="color:#bdc3c7;">—</span>'
            shown = sorted(smap, reverse=True)[:3]
            parts = []
            for n in shown:
                col = "#27ae60" if smap[n] == "open" else "#95a5a6"
                parts.append('<a href="https://github.com/huaweicloud/huaweicloud-devkit/issues/' + str(n)
                             + '" style="color:#2980b9;text-decoration:none;">#' + str(n) + '</a>'
                             + '<span title="' + smap[n] + '" style="color:' + col + ';font-size:10px;">●</span>')
            t = " ".join(parts)
            if len(smap) > 3:
                t += ' <span style="color:#95a5a6;">等 ' + str(len(smap)) + ' 个</span>'
            return t

        if v["defect_rows"]:
            d_rows = "".join(
                '<tr><td style="padding:5px 8px;border:1px solid #eee;">' + c + '</td>'
                '<td style="padding:5px 8px;border:1px solid #eee;"><b style="color:' + {"P0": "#c0392b", "P1": "#e67e22", "P2": "#2980b9"}.get(lv, "#333") + ';">' + lv + '</b></td>'
                '<td style="padding:5px 8px;border:1px solid #eee;text-align:left;">' + t + '</td>'
                '<td style="padding:5px 8px;border:1px solid #eee;white-space:nowrap;">' + v_issue(c) + '</td></tr>'
                for c, lv, t in v["defect_rows"])
            defect_block = ('<table style="border-collapse:collapse;width:100%;font-size:13px;margin-top:6px;">'
                            '<thead><tr style="background:#f7f7f7;"><th style="padding:5px 8px;border:1px solid #ddd;text-align:left;">用例</th>'
                            '<th style="padding:5px 8px;border:1px solid #ddd;">级别</th>'
                            '<th style="padding:5px 8px;border:1px solid #ddd;text-align:left;">缺陷</th>'
                            '<th style="padding:5px 8px;border:1px solid #ddd;text-align:left;">关联 Issue</th></tr></thead>'
                            '<tbody>' + d_rows + '</tbody></table>')
        else:
            defect_block = '<p style="color:#95a5a6;font-size:12px;margin:6px 0 0;">缺陷：' + v["defect"] + '</p>'
        k = v["kpi"]
        total = sum(k.values())
        denom = k.get("PASS", 0) + k.get("FAIL", 0) + k.get("SPEC-MISMATCH", 0)
        kpr = f"{round(k.get('PASS', 0) / denom * 100)}%" if denom else "—"
        kpi_h = (kpi(total, "总用例", "#34495e") + kpi(k.get("PASS", 0), "PASS", "#2ecc71")
                 + kpi(k.get("FAIL", 0), "FAIL", "#e74c3c") + kpi(k.get("BLOCKED", 0), "BLOCKED", "#f39c12")
                 + kpi(k.get("SPEC-MISMATCH", 0), "SPEC", "#e67e22") + kpi(kpr, "通过率", "#3498db"))
        exec_h = ""
        if v["dim_exec"] or v["expand_exec"]:
            st_cols = [("PASS", "PASS"), ("FAIL", "FAIL"), ("BLOCKED", "BLOCKED"), ("SPEC-MISMATCH", "SPEC"), ("NOT_RUN", "NOT_RUN")]
            st_head = ''.join('<th style="padding:4px 8px;border:1px solid #ddd;">' + lb + '</th>' for _, lb in st_cols)

            def _tbl(rows_html, first_label):
                return ('<table style="border-collapse:collapse;width:100%;font-size:12px;">'
                        '<thead><tr style="background:#f7f7f7;"><th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">' + first_label + '</th>'
                        '<th style="padding:4px 8px;border:1px solid #ddd;">用例数</th>' + st_head + '</tr></thead>'
                        '<tbody>' + rows_html + '</tbody></table>')

            def _exec_rows(mapping):
                out = ""
                for name in sorted(mapping):
                    cc = mapping[name]
                    out += ('<tr><td style="padding:4px 8px;border:1px solid #eee;"><b>' + name + '</b></td>'
                            '<td style="padding:4px 8px;border:1px solid #eee;text-align:center;">' + str(sum(cc.values())) + '</td>'
                            + ''.join('<td style="padding:4px 8px;border:1px solid #eee;text-align:center;color:' + (STATUS_COLOR.get(k, "#333") if cc.get(k) else "#bdc3c7") + ';">' + (str(cc.get(k)) if cc.get(k) else "—") + '</td>' for k, _ in st_cols)
                            + '</tr>')
                return out

            parts = []
            if v["dim_exec"]:
                parts.append('<h4 style="margin:12px 0 4px;">设计级执行情况（按维度）</h4>'
                             + _tbl(_exec_rows(v["dim_exec"]), "维度"))
            if v["expand_exec"]:
                parts.append('<h4 style="margin:12px 0 4px;">展开级执行情况（按类型）</h4>'
                             + _tbl(_exec_rows(v["expand_exec"]), "展开类型"))
            exec_h = ''.join(parts)
        case_block = ""
        if v["cases"]:
            v_rank = {"FAIL": 0, "SPEC-MISMATCH": 1, "NOT_RUN": 2, "PASS": 3}
            vcases = sorted(v["cases"], key=lambda x: (v_rank.get(x["status"], 9), x["id"]))
            vkey = v["ver"].replace(".", "").replace("-", "")
            d_cnt = sum(1 for x in v["cases"] if x["level"] == "设计级")
            e_cnt = sum(1 for x in v["cases"] if x["level"] == "展开级")
            vcase_rows = ""
            for c in vcases:
                st = c["status"] or "空"
                color = STATUS_COLOR.get(st, "#95a5a6")
                blk = ('<br><span style="color:#95a5a6;font-size:11px;">阻塞原因：' + c["blocked"] + '</span>') if c["blocked"] else ""
                vcase_rows += (
                    '<tr class="vcaserow" data-vk="' + vkey + '" data-vst="' + st + '">'
                    '<td style="padding:4px 8px;border:1px solid #eee;color:#7f8c8d;">' + c["level"] + '</td>'
                    '<td style="padding:4px 8px;border:1px solid #eee;"><b>' + c["id"] + '</b></td>'
                    '<td style="padding:4px 8px;border:1px solid #eee;text-align:center;">' + c["prio"] + '</td>'
                    '<td style="padding:4px 8px;border:1px solid #eee;text-align:left;">' + c["title"] + blk + '</td>'
                    '<td style="padding:4px 8px;border:1px solid #eee;white-space:nowrap;"><span style="display:inline-block;padding:1px 8px;border-radius:3px;color:#fff;background:' + color + ';">' + st + '</span></td></tr>')
            btns = ('<button class="casebtn active" data-vk="' + vkey + '" data-st="ALL" onclick="filterVCase(\'' + vkey + '\',\'ALL\')">全部</button>'
                    + ''.join('<button class="casebtn" data-vk="' + vkey + '" data-st="' + bv + '" onclick="filterVCase(\'' + vkey + '\',\'' + bv + '\')">' + bl + '</button>'
                              for bv, bl in [("FAIL", "FAIL"), ("SPEC-MISMATCH", "SPEC"), ("NOT_RUN", "NOT_RUN"), ("PASS", "PASS")]))
            case_block = (
                '<details style="margin-top:10px;">'
                '<summary style="cursor:pointer;color:#2980b9;font-size:13px;">用例执行明细（共 ' + str(len(v["cases"])) + ' 条：设计级 ' + str(d_cnt) + ' + 展开级 ' + str(e_cnt) + '）</summary>'
                '<div style="margin:6px 0;">' + btns + '</div>'
                '<table style="border-collapse:collapse;width:100%;font-size:12px;">'
                '<thead><tr style="background:#f7f7f7;"><th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">层级</th>'
                '<th style="padding:4px 8px;border:1px solid #ddd;">ID</th>'
                '<th style="padding:4px 8px;border:1px solid #ddd;">P</th>'
                '<th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">标题</th>'
                '<th style="padding:4px 8px;border:1px solid #ddd;">状态</th></tr></thead>'
                '<tbody>' + vcase_rows + '</tbody></table></details>')
        meta_parts = [f'工具全集 {v["tool"]}'] if v["tool"] else []
        if v["env"]:
            meta_parts.append(v["env"])
        meta = " ｜ ".join(meta_parts)
        meta_html = '<p style="color:#7f8c8d;font-size:12px;margin:8px 0 6px;">' + meta + '</p>' if meta else ''
        pr = '<br>通过率：<b>' + v["pass_rate"] + '</b>' if v["pass_rate"] else ''
        total_v = sum(v["kpi"].values()) if v["kpi"] else (len(v["cases"]) or "—")
        version_detail += (
            '<details class="verdetail" style="border:1px solid #ddd;border-radius:6px;margin:14px 0;">'
            '<summary style="cursor:pointer;padding:12px 14px;font-size:15px;font-weight:700;">'
            + v["ver"]
            + ' <span style="color:#7f8c8d;font-weight:400;font-size:13px;">（' + v["obj"] + '）</span>'
            + ' <span style="color:#95a5a6;font-weight:400;font-size:12px;">· ' + str(total_v) + ' 用例 · 通过率 ' + (v["pass_rate"] or "—") + '</span>'
            + '</summary>'
            + '<div style="padding:0 14px 14px;">'
            + '<div style="display:flex;flex-wrap:wrap;margin:-4px;">' + kpi_h + '</div>'
            + meta_html
            + '<div style="font-size:13px;">设计级：' + v["design"] + '<br>展开级：' + v["expand"] + pr + '</div>'
            + exec_h
            + '<h4 style="margin:12px 0 4px;">缺陷清单</h4>'
            + defect_block
            + case_block
            + '</div></details>')

    # ---- 技能评测页签（读 skill-bench summary.json）----
    bench = load_bench()
    if bench:
        bench_rows = "".join(
            '<tr>'
            '<td style="padding:6px 8px;border:1px solid #ddd;text-align:left;">{}</td>'
            '<td style="padding:6px 8px;border:1px solid #ddd;color:#7f8c8d;">{}</td>'
            '<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;"><b style="color:#2ecc71;">{}</b></td>'
            '<td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">{:,}</td>'
            '<td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">{:,}</td>'
            '<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">{}</td>'
            '<td style="padding:6px 8px;border:1px solid #ddd;text-align:left;color:#555;">{}</td>'
            '</tr>'.format(t.get("title", ""), t.get("skill", ""), t.get("rate", "—"),
                           t.get("token_in", 0), t.get("token_out", 0), t.get("steps", 0),
                           t.get("detail", ""))
            for t in bench.get("tasks", []))
        def _bare_td(b):
            std = b.get("std_token", 0) or 0
            bm = b.get("bare_token", 0) or 0
            save = std - bm
            pct = (save / std * 100) if std else 0
            return ('<tr>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:left;">{}</td>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">{}</td>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">{}</td>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">{:,}</td>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:right;">{:,}</td>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:center;color:#27ae60;">-{:.0f}% ({:,})</td>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">{}</td>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:center;">{}</td>'
                    '<td style="padding:5px 8px;border:1px solid #ddd;text-align:left;">{}</td>'
                    '</tr>'.format(b.get("title", ""),
                                   b.get("std_rate", "—"), b.get("bare_rate", "—"),
                                   std, bm, pct, save,
                                   b.get("std_steps", 0), b.get("bare_steps", 0),
                                   b.get("note", "")))
        bare_rows = "".join(_bare_td(b) for b in bench.get("bare", []))
        finding_items = "".join(
            '<li style="margin:4px 0;">{}</li>'.format(f)
            for f in bench.get("findings", []))
        bench_block = (
            '<h2>技能评测 · 端到端三指标基线</h2>'
            '<p style="color:#7f8c8d;font-size:12px;">数据源 skill-bench/（独立于每日测试流水线）；模型 {}，temperature=0，每任务采样 {} 次，更新于 {}。</p>'
            '<table style="border-collapse:collapse;width:100%;font-size:13px;">'
            '<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">任务</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;">技能</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;">成功率</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;">token IN</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;">token OUT</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;">步数</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">执行结果</th></tr></thead>'
            '<tbody>' + bench_rows + '</tbody></table>'
            '<h2 style="margin-top:16px;">裸模型对照（--bare，初步：标准=3采样中位 / 裸=1采样）</h2>'
            '<table style="border-collapse:collapse;width:100%;font-size:13px;">'
            '<thead>'
            '<tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;" rowspan="2">任务</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;" colspan="2">成功率</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;" colspan="2">token</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;" rowspan="2">裸模型省 token</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;" colspan="2">步数</th>'
            '<th style="padding:6px 8px;border:1px solid #ddd;text-align:left;" rowspan="2">裸模型问题</th></tr>'
            '<tr style="background:#f2f2f2;"><th style="padding:4px 6px;border:1px solid #ddd;">标准</th><th style="padding:4px 6px;border:1px solid #ddd;">裸模型</th>'
            '<th style="padding:4px 6px;border:1px solid #ddd;">标准</th><th style="padding:4px 6px;border:1px solid #ddd;">裸模型</th>'
            '<th style="padding:4px 6px;border:1px solid #ddd;">标准</th><th style="padding:4px 6px;border:1px solid #ddd;">裸模型</th></tr>'
            '</thead>'
            '<tbody>' + bare_rows + '</tbody></table>'
            '<h2 style="margin-top:16px;">关键发现</h2>'
            '<ul style="font-size:13px;">' + finding_items + '</ul>'
            '<p style="color:#7f8c8d;font-size:12px;">详情见 skill-bench/results/baseline-report-20261014.md 与 baseline-bare-comparison-20261014.md。</p>'
        ).format(bench.get("model", "—"), bench.get("runs", "3"), bench.get("updated", "—"))
    else:
        bench_block = '<p style="color:#95a5a6;">暂无技能评测基线（运行 skill-bench harness 后生成 summary.json）。</p>'

    # ---- UX 专项页签（读 results/UX专项/UX专项-<日期>.json + test-cases/ux 设计态）----
    ux_block = render_ux_block(load_ux_special(), load_ux_design())

    html = f"""<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>huaweicloud-devkit 测试执行总览看板</title>
<style>
.tabs{{display:flex;gap:4px;margin:0 0 12px;border-bottom:3px solid #2c3e50;position:sticky;top:0;background:#fff;padding:10px 0 6px;z-index:100;}}
.tab-btn{{padding:8px 20px;cursor:pointer;border:1px solid #ddd;border-bottom:none;background:#f7f7f7;color:#2c3e50;font-size:14px;border-radius:6px 6px 0 0;}}
.tab-btn.active{{background:#2c3e50;color:#fff;border-color:#2c3e50;font-weight:700;}}
.casebtn{{padding:3px 12px;margin-right:4px;cursor:pointer;border:1px solid #ddd;background:#fff;color:#2c3e50;font-size:12px;border-radius:4px;}}
.casebtn.active{{background:#2c3e50;color:#fff;border-color:#2c3e50;}}
.uxbtn{{padding:3px 12px;margin-right:4px;cursor:pointer;border:1px solid #ddd;background:#fff;color:#2c3e50;font-size:12px;border-radius:4px;}}
.uxbtn.active{{background:#2c3e50;color:#fff;border-color:#2c3e50;}}
</style></head>
<body style="font-family:'Segoe UI',Arial,'Microsoft YaHei',sans-serif;color:#2c3e50;max-width:1040px;margin:20px auto;padding:0 16px;">
<h1 style="border-bottom:3px solid #2c3e50;padding-bottom:8px;">huaweicloud-devkit 测试执行总览看板</h1>
<p style="color:#7f8c8d;">被测版本：<b>{version}</b> ｜ 数据截至：<b>{vdate}</b> ｜ 最后更新：<b>{gen_ts}</b>（北京时间，每小时刷新）</p>

<div class="tabs">
<button class="tab-btn active" id="btn-daily" onclick="showTab('daily')">每日执行</button>
<button class="tab-btn" id="btn-version" onclick="showTab('version')">版本执行</button>
<button class="tab-btn" id="btn-bench" onclick="showTab('bench')">技能评测</button>
<button class="tab-btn" id="btn-ux" onclick="showTab('ux')">UX 专项</button>
</div>

<div id="tab-daily">
<h2>总体执行（{vdate}）</h2>
<div style="display:flex;flex-wrap:wrap;margin:-4px;">{kpis}</div>
<p style="color:#7f8c8d;font-size:12px;">通过率分母 = PASS+FAIL+SPEC（不含 BLOCKED/NOT_RUN）；数据直接取自《每日测试汇总》报告执行摘要。</p>

<h2>每日执行趋势</h2>
<p style="color:#7f8c8d;font-size:12px;">按月份分组展开查看；每块显示当月天数与平均通过率，最新月份默认展开。</p>
{daily_blocks}
<div style="margin:12px 0;"><div style="color:#7f8c8d;font-size:12px;margin-bottom:4px;">通过率趋势（%）</div>
{sparkline(rate_vals)}</div>
<p style="color:#95a5a6;font-size:11px;">趋势数据 = 每日《每日测试汇总》报告的执行摘要。09-13/14 当日报告使用「机器×用例」累加口径，09-15 起为「用例级去重」口径，跨口径仅作趋势参考。</p>

<h2>每日 open issue 趋势</h2>
<div style="color:#7f8c8d;font-size:12px;margin-bottom:4px;">关联历史单中 open 状态数量（每日快照、issue 号去重）</div>
{sparkline(it_vals, color="#27ae60", pct=False)}
<p style="color:#95a5a6;font-size:11px;">{it_label}</p>

<h2>客户端执行概览（{vdate}）</h2>
<p style="color:#7f8c8d;">{client_overview}</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead>{client_head}</thead><tbody>{client_rows}</tbody></table>

<h2>缺陷存量（{vdate}，FAIL 用例按优先级）</h2>
<div style="display:flex;flex-wrap:wrap;margin:-4px;">{prio_kpi}</div>
<p style="color:#7f8c8d;font-size:12px;">关联 Issue 状态：<span style="color:#27ae60;">●</span> open（未关闭） ｜ <span style="color:#95a5a6;">●</span> closed（已关闭）</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;margin-top:8px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;">优先级</th><th style="padding:6px 8px;border:1px solid #ddd;">ID</th><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">标题</th><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">关联 Issue</th></tr></thead>
<tbody>{fail_rows}</tbody></table>

<h2>各维度用例统计（{vdate}，设计级共 {len(latest_cmp["design_rows"])} 条）</h2>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">维度</th><th style="padding:6px 8px;border:1px solid #ddd;">用例数</th>
{''.join(f'<th style="padding:6px 8px;border:1px solid #ddd;">{p}</th>' for p in latest_cmp["prio_values"])}</tr></thead>
<tbody>{dim_rows}</tbody></table>

<h2>用例执行明细（{vdate}）</h2>
<p style="color:#7f8c8d;font-size:12px;margin:0 0 8px;">末列圆点 = 10 个智能体在该用例的最差状态（悬停可见），颜色同执行摘要；默认按缺陷严重度排序。</p>
<div style="margin:0 0 8px;">
<button class="casebtn active" onclick="filterCase('ALL')">全部</button>
<button class="casebtn" onclick="filterCase('FAIL')">FAIL</button>
<button class="casebtn" onclick="filterCase('BLOCKED')">BLOCKED</button>
<button class="casebtn" onclick="filterCase('SPEC-MISMATCH')">SPEC</button>
<button class="casebtn" onclick="filterCase('NOT_RUN')">NOT_RUN</button>
<button class="casebtn" onclick="filterCase('PASS')">PASS</button>
</div>
<table style="border-collapse:collapse;width:100%;font-size:12px;">
<thead><tr style="background:#f2f2f2;"><th style="padding:5px 8px;border:1px solid #ddd;">状态</th><th style="padding:5px 8px;border:1px solid #ddd;">ID</th><th style="padding:5px 8px;border:1px solid #ddd;text-align:left;">维度</th><th style="padding:5px 8px;border:1px solid #ddd;">P</th><th style="padding:5px 8px;border:1px solid #ddd;text-align:left;">标题</th><th style="padding:5px 8px;border:1px solid #ddd;text-align:left;">客户端（10 智能体）</th><th style="padding:5px 8px;border:1px solid #ddd;text-align:left;">历史单号</th></tr></thead>
<tbody>{case_rows}</tbody></table>

</div>

<div id="tab-version" style="display:none;">
<h2>版本全量测试</h2>
<p style="color:#7f8c8d;font-size:12px;">数据源 results/version/*/README.md；设计级/展开级/通过率为各版本收口全量结果。</p>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
<thead>
<tr style="background:#f2f2f2;"><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;" rowspan="2">版本</th><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;" rowspan="2">被测对象</th><th style="padding:6px 8px;border:1px solid #ddd;" rowspan="2">用例数</th><th style="padding:6px 8px;border:1px solid #ddd;" colspan="5">设计级</th><th style="padding:6px 8px;border:1px solid #ddd;" colspan="5">展开级</th><th style="padding:6px 8px;border:1px solid #ddd;" rowspan="2">通过率</th><th style="padding:6px 8px;border:1px solid #ddd;text-align:left;" rowspan="2">缺陷</th></tr>
<tr style="background:#f2f2f2;"><th style="padding:4px 6px;border:1px solid #ddd;">PASS</th><th style="padding:4px 6px;border:1px solid #ddd;">FAIL</th><th style="padding:4px 6px;border:1px solid #ddd;">BLOCKED</th><th style="padding:4px 6px;border:1px solid #ddd;">SPEC</th><th style="padding:4px 6px;border:1px solid #ddd;">NOT_RUN</th><th style="padding:4px 6px;border:1px solid #ddd;">PASS</th><th style="padding:4px 6px;border:1px solid #ddd;">FAIL</th><th style="padding:4px 6px;border:1px solid #ddd;">BLOCKED</th><th style="padding:4px 6px;border:1px solid #ddd;">SPEC</th><th style="padding:4px 6px;border:1px solid #ddd;">NOT_RUN</th></tr>
</thead>
<tbody>{version_rows}</tbody></table>
{version_detail}
</div>

<div id="tab-bench" style="display:none;">
{bench_block}
</div>

<div id="tab-ux" style="display:none;">
{ux_block}
</div>

<p style="color:#95a5a6;font-size:11px;margin-top:24px;">本看板由 scripts/gen_dashboard.py 自动生成；执行摘要取自每日《每日测试汇总》报告。执行态与母版用例定义分离，真实结果以 results/Summary/ 为准；UX 专项取自 results/UX专项/（由 scripts/gen_ux_special.py 跑 eval/harness/fixtures/run-ux.mjs 生成）。</p>
<script>
function showTab(n){{document.getElementById('tab-daily').style.display=n==='daily'?'block':'none';document.getElementById('tab-version').style.display=n==='version'?'block':'none';document.getElementById('tab-bench').style.display=n==='bench'?'block':'none';document.getElementById('tab-ux').style.display=n==='ux'?'block':'none';document.getElementById('btn-daily').className='tab-btn'+(n==='daily'?' active':'');document.getElementById('btn-version').className='tab-btn'+(n==='version'?' active':'');document.getElementById('btn-bench').className='tab-btn'+(n==='bench'?' active':'');document.getElementById('btn-ux').className='tab-btn'+(n==='ux'?' active':'');}}
function filterCase(st){{var btns=document.querySelectorAll('.casebtn');for(var i=0;i<btns.length;i++){{btns[i].className='casebtn'+(btns[i].getAttribute('onclick').indexOf(st)!==-1?' active':'');}}var rows=document.querySelectorAll('.caserow');for(var j=0;j<rows.length;j++){{var s=rows[j].getAttribute('data-st');rows[j].style.display=(st==='ALL'||s===st)?'':'none';}}}}
function filterVCase(vk,st){{var btns=document.querySelectorAll('.casebtn[data-vk="'+vk+'"]');for(var i=0;i<btns.length;i++){{btns[i].className='casebtn'+(btns[i].getAttribute('data-st')===st?' active':'');}}var rows=document.querySelectorAll('.vcaserow[data-vk="'+vk+'"]');for(var j=0;j<rows.length;j++){{var s=rows[j].getAttribute('data-vst');rows[j].style.display=(st==='ALL'||s===st)?'':'none';}}}}
function filterUxCase(st){{var btns=document.querySelectorAll('.uxbtn');for(var i=0;i<btns.length;i++){{btns[i].className='uxbtn'+(btns[i].getAttribute('data-f')===st?' active':'');}}var rows=document.querySelectorAll('.uxrow');for(var j=0;j<rows.length;j++){{var s=rows[j].getAttribute('data-ux');rows[j].style.display=(st==='ALL'||s===st)?'':'none';}}}}
</script>
</body></html>"""
    return html


def main():
    dates = available_dates()
    if not dates:
        print("[错误] 未找到「每日测试汇总」报告")
        sys.exit(2)
    version, vdate = baseline_version(dates)
    days = build_daily(dates)
    if not days:
        print("[错误] 报告执行摘要解析失败")
        sys.exit(2)
    links = load_issue_links(dates)
    notes = load_defect_notes(dates)
    versions = load_versions()
    gen_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    html = render(days, version, vdate, gen_ts, links, notes, versions)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"总览看板生成: {OUT}")
    print(f"覆盖 {len(days)} 天报告（{days[0]['date']} ~ {days[-1]['date']}）")


if __name__ == "__main__":
    main()