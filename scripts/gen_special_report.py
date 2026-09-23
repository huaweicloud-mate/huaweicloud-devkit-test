# -*- coding: utf-8 -*-
"""生成每日专项分析报告：聚焦 BLOCKED 阻塞问题 + 无单号跟踪的失败问题。

用法（维护者，每日汇总报告生成后跑一次）:
    python gen_special_report.py [日期]

数据源:
    results/Summary/用例矩阵-{设计级|展开级}-总执行结果-<日期>.csv   (build_summary.py 生成)
    results/<客户端>/<日期>-<IP>/<OS>/用例矩阵-*.csv                  (blockedReason)
    results/<客户端>/<日期>-<IP>/<OS>/HISTORY_LINKS.md + FINDINGS.md  (issue 单号关联)

输出:
    results/Summary/专项分析-<日期>.md

口径（与「每日测试汇总」缺陷清单对齐，状态取 R._worst）:
  - BLOCKED：用例级最差状态 == BLOCKED 的用例（排除「某客户端误把不适用项标 BLOCKED」的噪音，
    也排除「同用例另一客户端已 FAIL/SPEC」的用例，此时该用例归入失败而非阻塞）。
  - 无单号跟踪：FAIL / SPEC-MISMATCH 用例中，在 HISTORY_LINKS.md 与 FINDINGS.md 均找不到
    任何 GitHub issue 单号（#数字）关联的，即真正待提单/待查重缺口。展开级回退到「源用例」判定。
"""
import os, sys, csv, datetime, re
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import report_html as R

REPO = R.REPO
SKIP_DIRS = R.SKIP_DIRS


# ---------- 用例号 / issue 单号解析（与 gen_dashboard.py 同口径，独立自包含） ----------

def extract_case_ids(text):
    ids = set()
    for m in re.findall(r"[Dd]\s*\d{1,2}\s*[-–—]\s*[A-Za-z0-9][A-Za-z0-9-]*", text or ""):
        ids.add(re.sub(r"\s+", "", m).upper())
    for m in re.findall(r"EXP-[A-Z0-9-]+", (text or "").upper()):
        ids.add(m.rstrip("-"))
    return ids


def _parse_history_links(text):
    """解析单份 HISTORY_LINKS.md -> {用例ID: set(issue号)}。"""
    links = {}
    current = None
    for line in text.split("\n"):
        m = re.match(r"^## (.+)$", line)
        if m:
            current = extract_case_ids(m.group(1))
            for cid in current:
                links.setdefault(cid, set())
            continue
        m2 = re.match(r"\s*-\s*\[#(\d+)\]\([^)]*\)", line, re.I)
        if m2 and current:
            for cid in current:
                links[cid].add(int(m2.group(1)))
    return links


def _findings_issue_map(text):
    """解析单份 FINDINGS.md -> {用例ID: set(issue号)}：标题里的用例号 + 状态字段里的 #数字。"""
    mapping = {}
    for m in re.finditer(r"^## #\d+【([^】]+)】(.+)$", text, re.M):
        title = m.group(2).strip()
        seg = text[m.end():]
        nxt = re.search(r"^## ", seg, re.M)
        seg = seg[:nxt.start()] if nxt else seg
        status = re.search(r"[-*]\s*\*\*状态[^*]*\*\*[：:]\s*(.+)", seg)
        issue_nums = set(int(x) for x in re.findall(r"#(\d+)", status.group(1) if status else ""))
        for cid in extract_case_ids(title):
            mapping.setdefault(cid, set()).update(issue_nums)
    return mapping


def load_case_issues(date):
    """汇总当日各客户端 HISTORY_LINKS.md + FINDINGS.md 的 用例ID -> issue单号 映射。"""
    issues = defaultdict(set)
    results_dir = os.path.join(REPO, "results")
    if not os.path.isdir(results_dir):
        return issues
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
                base = os.path.join(cdir, sub, os_name)
                hl = os.path.join(base, "HISTORY_LINKS.md")
                if os.path.isfile(hl):
                    for cid, nums in _parse_history_links(open(hl, encoding="utf-8").read()).items():
                        issues[cid].update(nums)
                fd = os.path.join(base, "FINDINGS.md")
                if os.path.isfile(fd):
                    for cid, nums in _findings_issue_map(open(fd, encoding="utf-8").read()).items():
                        issues[cid].update(nums)
    return issues


# ---------- BLOCKED 阻塞项采集 ----------

def _parse_blocked_reason(reason):
    """blockedReason -> {缺, 影响, 解除}。支持三种形态：
    ①「实测时间:x|缺:x|影响:x|解除:x」四要素；②「实:<时间戳>｜缺:...」变体；
    ③ 叙述体「xxx；解除条件:xxx」（无字段前缀，内嵌解除条件）。
    清理 tuple 字符串包装（某客户端误把 ('P0','...') 写进 blockedReason）。"""
    reason = (reason or "").strip()
    # 清理 tuple 字符串包装：('P2', 'xxx') -> xxx
    reason = re.sub(r"^\s*\(\s*['\"][^'\"]*['\"]\s*,\s*['\"]", "", reason)
    reason = re.sub(r"['\"]\s*\)\s*$", "", reason)
    out = {"缺": "", "影响": "", "解除": ""}
    # 去掉时间戳噪音段
    reason = re.sub(r"(实测时间|实)\s*[:：]\s*[^|｜]*[|｜]", "", reason)
    # 切出内嵌「；解除条件/解除:xxx」（叙述体无 | 分隔）
    m = re.search(r"[；;]\s*(?:解除条件|解除)\s*[:：]\s*(.+)$", reason, re.S)
    if m:
        out["解除"] = m.group(1).strip()
        reason = reason[:m.start()]
    # 按 |｜ 拆字段：识别 缺/影响/解除 前缀，落单片段并入「缺」
    lacks = []
    for part in re.split(r"[|｜]", reason):
        part = part.strip()
        if not part:
            continue
        m2 = re.match(r"(缺|影响|解除)\s*[:：]\s*(.+)", part, re.S)
        if m2:
            out[m2.group(1)] = (out.get(m2.group(1)) or "") + m2.group(2).strip()
        elif part not in lacks:
            lacks.append(part)
    if lacks and not out["缺"]:
        out["缺"] = "；".join(lacks)
    if not any(out.values()):
        out["缺"] = reason
    return out


def _clean_cell(text, limit):
    """清理阻塞点文本（去执行标记前缀），截断到 limit 字。"""
    t = re.sub(r"【[^】]*】", "", text or "").strip(" ；;，,")
    t = re.sub(r"\s+", " ", t)
    if len(t) > limit:
        t = t[:limit] + "…"
    return t or "-"


def _classify_blocked(reason):
    """基于 blockedReason 文本轻量归类（未命中归「其他」）。"""
    r = (reason or "").lower()
    if re.search(r"破坏性|run-only|run only|不执行|不卸载|不安装", r):
        return "既定阻塞（run-only 不做破坏性操作）"
    if re.search(r"harness|真实\s*agent|真实会话|llm", r):
        return "LLM harness / 真实会话评测依赖"
    if re.search(r"真云|cts|kool|hcloud.*(创建|删除|凭证)", r):
        return "需真云资源/场景"
    if re.search(r"多客户端|共存|多\s*agent\s*同机|多机", r):
        return "多客户端共存环境缺失"
    if re.search(r"权限|ak/sk|凭证|iam|policy|authorized|credential", r):
        return "凭据/权限"
    if re.search(r"网络|registry|镜像|npm|github|gitcode|源|dns|timeout|连接", r):
        return "网络/软件源"
    if re.search(r"windows|macos", r):
        return "OS 专属（非本机）"
    if re.search(r"mcp|协议|tools/call|initialize|stdio|时钟|夹具|profile|审计|sbom", r):
        return "需隔离环境/夹具/基建"
    return "其他"


def collect_blocked(date, rows):
    """收集「用例级最差状态 == BLOCKED」的用例及其各客户端 blockedReason。

    返回 [{id, 层级, 标题, 优先级, 客户端[], 缺[], 影响[], 解除[], 类}]，已按 ID 聚合去重。
    """
    cases = {}
    for r in rows:
        if R._worst(r.get("当日总执行状态")) == "BLOCKED":
            cases[r.get("ID")] = {
                "id": r.get("ID"), "层级": r.get("层级"), "标题": R._case_title(r),
                "优先级": r.get("优先级"), "客户端": [], "缺": [], "影响": [], "解除": [], "原文": [],
            }
    if not cases:
        return []

    results_dir = os.path.join(REPO, "results")
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
                base = os.path.join(cdir, sub, os_name)
                for kind in ("设计级", "展开级"):
                    fp = os.path.join(base, f"用例矩阵-{kind}.csv")
                    if not os.path.isfile(fp):
                        continue
                    for r in csv.DictReader(open(fp, encoding="utf-8-sig")):
                        if (r.get("执行状态") or "").strip() != "BLOCKED":
                            continue
                        cid = (r.get("ID") or "").strip()
                        if cid not in cases:
                            continue
                        reason = (r.get("blockedReason") or "").strip()
                        parsed = _parse_blocked_reason(reason)
                        case = cases[cid]
                        if client not in case["客户端"]:
                            case["客户端"].append(client)
                        for k in ("缺", "影响", "解除"):
                            if parsed[k] and parsed[k] not in case[k]:
                                case[k].append(parsed[k])
                        if reason and reason not in case["原文"]:
                            case["原文"].append(reason)

    out = []
    for cid, c in cases.items():
        reason_span = " ".join(c["缺"] + c["解除"] + c["原文"])
        c["类"] = _classify_blocked(reason_span)
        c["客户端"] = sorted(c["客户端"])
        out.append(c)
    prio_rank = {"P0": 0, "P1": 1, "P2": 2}
    out.sort(key=lambda x: (prio_rank.get(x["优先级"], 9), x["层级"], x["id"]))
    return out


# ---------- 渲染 ----------

def _render_blocked(cases):
    if not cases:
        return "## 一、BLOCKED 阻塞问题\n\n> 今日无 BLOCKED 阻塞项。\n"
    n_design = sum(1 for c in cases if c["层级"] == "设计级")
    n_expand = sum(1 for c in cases if c["层级"] == "展开级")
    n_p0 = sum(1 for c in cases if c["优先级"] == "P0")
    client_cnt = Counter()
    for c in cases:
        for cl in c["客户端"]:
            client_cnt[cl] += 1
    cat_cnt = Counter(c["类"] for c in cases)

    lines = ["## 一、BLOCKED 阻塞问题", ""]
    lines.append(f"- 阻塞用例总数：**{len(cases)}**（设计级 {n_design} / 展开级 {n_expand}），**P0 阻塞 {n_p0} 项**。")
    lines.append(f"- 涉及客户端：{', '.join(f'{k}×{v}' for k, v in sorted(client_cnt.items()))}。")
    lines.append("")
    lines.append("### 阻塞原因归类")
    lines.append("| 原因类别 | 用例数 |")
    lines.append("| --- | --- |")
    for k, v in cat_cnt.most_common():
        lines.append(f"| {k} | {v} |")
    lines.append("")
    lines.append("### 阻塞清单明细")
    lines.append("| ID | 标题 | 优先级 | 层级 | 阻塞客户端 | 缺（阻塞点） | 解除条件 |")
    lines.append("| --- | --- | --- | --- | --- | --- | --- |")
    for c in cases:
        cl = "、".join(c["客户端"])
        lack = _clean_cell("；".join(c["缺"]), 60)
        unlock = _clean_cell("；".join(c["解除"]), 40)
        lines.append(f"| {c['id']} | {c['标题']} | {c['优先级']} | {c['层级']} | {cl} | {lack} | {unlock} |")
    lines.append("")
    return "\n".join(lines)


def _render_unlinked(rows, issues):
    parent_children = load_parent_children()
    status = {r.get("ID"): R._worst(r.get("当日总执行状态")) for r in rows}
    fail_spec = 0
    unlinked = []
    for r in rows:
        st = R._worst(r.get("当日总执行状态"))
        if st not in ("FAIL", "SPEC-MISMATCH"):
            continue
        fail_spec += 1
        cid = (r.get("ID") or "").strip()
        source = (r.get("源用例") or "").strip()
        if issues.get(cid) or issues.get(source):
            continue
        # 父级聚合回退：设计级父用例的 FAIL 若由已跟踪的展开子用例解释，则不列「无单号跟踪」
        if (r.get("层级") or "").strip() == "设计级":
            children_fail = [c for c in parent_children.get(cid.upper(), [])
                             if status.get(c) in ("FAIL", "SPEC-MISMATCH")]
            if children_fail and all(issues.get(c) for c in children_fail):
                continue
        unlinked.append((r, st))
    unlinked.sort(key=lambda t: ({"P0": 0, "P1": 1, "P2": 2}.get((t[0].get("优先级") or "").strip(), 9),
                                 t[0].get("层级", ""), t[0].get("ID", "")))
    n_linked = fail_spec - len(unlinked)

    lines = ["## 二、无单号跟踪的失败问题（FAIL / SPEC-MISMATCH）", ""]
    lines.append("> 判定口径：FAIL / SPEC-MISMATCH 用例中，在当日各客户端 **HISTORY_LINKS.md** 与 **FINDINGS.md** "
                 "里均找不到任何 GitHub issue 单号（`#数字`）关联的，列为「无单号跟踪」。展开级用例回退到其 `源用例` 判定。")
    lines.append("")
    lines.append(f"- FAIL + SPEC-MISMATCH 用例总数：**{fail_spec}**")
    lines.append(f"- 已有关联单号：**{n_linked}**")
    lines.append(f"- **无单号跟踪：{len(unlinked)}** ← 需重点处理（真正待提单/待查重缺口）")
    lines.append("")
    if not unlinked:
        lines.append("> 今日全部 FAIL / SPEC-MISMATCH 均已关联 issue 单号，无缺口。")
        lines.append("")
        return "\n".join(lines)

    lines.append("### 无单号跟踪清单")
    lines.append("| ID | 标题 | 优先级 | 层级 | 状态 |")
    lines.append("| --- | --- | --- | --- | --- |")
    for r, st in unlinked:
        lines.append(f"| {r.get('ID','')} | {R._case_title(r)} | {r.get('优先级','')} | {r.get('层级','')} | {st} |")
    lines.append("")
    lines.append("### 建议动作")
    lines.append("1. 对上述无单号跟踪项执行 `python scripts/file_issue.py --dry-run` 查询上游历史 issue（查重）。")
    lines.append("2. 命中历史单 → 补 `HISTORY_LINKS.md` 关联，不重复开单（仅在既有单补复核评论）。")
    lines.append("3. 确认新问题 → 合并一张单提单，附根因与测试报告。")
    lines.append("")
    return "\n".join(lines)


def _extract_version(date):
    """被测版本：优先读汇总报告；读不到则从当日 FINDINGS.md 提取出现最多的版本号。"""
    md_path = os.path.join(REPO, "results", "Summary", f"每日测试汇总-{date}.md")
    if os.path.isfile(md_path):
        m = re.search(r"被测版本：\*\*(.+?)\*\*", open(md_path, encoding="utf-8").read())
        if m and m.group(1).strip() and m.group(1).strip() != "（未指定）":
            return m.group(1).strip()
    # fallback：从各客户端 FINDINGS.md 提取版本号，取出现最多者
    versions = Counter()
    results_dir = os.path.join(REPO, "results")
    if os.path.isdir(results_dir):
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
                    for m in re.finditer(r"huaweicloud-devkit@([\d][\w.\-]*)", text):
                        versions[m.group(1)] += 1
    if versions:
        return f"v{versions.most_common(1)[0][0]}"
    return "（未指定）"


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y-%m-%d")
    rows = R.load_summary(date)
    if not rows:
        print(f"[错误] 未找到 Summary 数据：请先跑 python build_summary.py {date}")
        sys.exit(2)

    blocked = collect_blocked(date, rows)
    issues = load_case_issues(date)
    version = _extract_version(date)

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    header = (
        f"# huaweicloud-devkit 每日专项分析报告\n\n"
        f"日期：**{date}** ｜ 被测版本：**{version}** ｜ 生成时间：**{now}**（北京时间）\n\n"
        f"> 本报告聚焦两类需维护者关注的问题：① BLOCKED 阻塞项（含阻塞原因四要素）；"
        f"② FAIL / SPEC-MISMATCH 中尚无 GitHub issue 单号跟踪的失败问题。\n"
        f"> 数据源：results/Summary 总执行结果 + 各客户端执行包 blockedReason + HISTORY_LINKS.md / FINDINGS.md 单号关联。\n\n"
    )
    body = _render_blocked(blocked) + "\n" + _render_unlinked(rows, issues)

    out = os.path.join(REPO, "results", "Summary", f"专项分析-{date}.md")
    with open(out, "w", encoding="utf-8") as f:
        f.write(header + body)
    print(f"专项分析报告生成: {out}")
    print(f"  BLOCKED 阻塞用例 {len(blocked)} 条")


def load_parent_children():
    """读展开级母版，建立 设计级父用例(源用例) -> 展开级子用例ID 映射。

    用于「父级聚合回退」：设计级用例（D3-C4）的 FAIL 由展开级子用例（EXP-C4-14/18）解释时，
    若这些子用例已有关联单号，父用例不单独列入「无单号跟踪」。
    """
    mapping = {}
    fp = os.path.join(REPO, "test-cases", "expanded", "用例矩阵-展开级.csv")
    if not os.path.isfile(fp):
        return mapping
    with open(fp, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            src = (r.get("源用例") or "").strip().upper()
            cid = (r.get("ID") or "").strip().upper()
            if src and cid and src != cid:
                mapping.setdefault(src, []).append(cid)
    return mapping


if __name__ == "__main__":
    main()