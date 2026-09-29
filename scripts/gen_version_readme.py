# -*- coding: utf-8 -*-
"""生成版本全量测试收口 README.md（归档 results/version/<版本>/ 时必跑）。

用法:
    python gen_version_readme.py <版本>       # 例: python gen_version_readme.py v1.1.7

从 results/version/<版本>/<Windows|Linux>/ 下各 OS 的测试报告 + 执行结果 CSV +
FINDINGS.md + HISTORY_LINKS.md 提取字段，生成 results/version/<版本>/README.md。

该 README 是 gen_dashboard.py 的 load_versions() 输入（看板版本列表依它展示），
缺失则看板不展示该版本。字段格式须匹配 load_versions 的正则（见下）。
"""
import os, sys, re, csv
from collections import Counter

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VDIR = os.path.join(REPO, "results", "version")


def find_os_dirs(ver):
    d = os.path.join(VDIR, ver)
    if not os.path.isdir(d):
        return []
    return sorted(x for x in os.listdir(d)
                  if os.path.isdir(os.path.join(d, x)) and x.lower() in ("windows", "linux"))


def stat_csv(fp):
    if not os.path.isfile(fp):
        return None
    cnt = Counter()
    with open(fp, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            st = (r.get("执行状态") or "").strip() or "NOT_RUN"
            cnt[st] += 1
    return cnt


def pick_report(osd):
    if not os.path.isdir(osd):
        return None
    for fn in sorted(os.listdir(osd)):
        if fn.endswith("测试报告.md") or fn.endswith("测试报告.MD"):
            return os.path.join(osd, fn)
    return None


def extract_commit_branch(text):
    """尽量从测试报告提取被测 commit + branch，多正则 fallback。"""
    commit = branch = ""
    m = re.search(r"gitHead\s+([0-9a-fA-F]{7,40})(?:[ )（]|$)\s*([^\s，,）)]*)", text)
    if m:
        commit = m.group(1)
        branch = re.sub(r"^[)（]|[,，].*$", "", m.group(2).strip())
    if not commit:
        m = re.search(r"commit\s+`([0-9a-fA-F]{7,40})`", text)
        if m:
            commit = m.group(1)
    if not commit:
        m = re.search(r"commit\s+([0-9a-fA-F]{7,40})", text)
        if m:
            commit = m.group(1)
    if not branch:
        m = re.search(r"commit\s+`[0-9a-fA-F]+`[（(]([^\s，,）)]+)", text)
        if m:
            branch = m.group(1)
    return commit, branch


def extract_tool_env(text):
    tool = ""
    m = re.search(r"(\d+)\s*个?\s*MCP\s*工具", text)
    if m:
        tool = m.group(1)
    env = ""
    m = re.search(r"Node\s*/\s*npm\s*/\s*Python[：:\s]*(.{0,60})", text)
    if m:
        env = m.group(1).strip()
    return tool, env


def extract_defects(findings_text):
    """从 FINDINGS.md 提取 (级别, 用例, 缺陷) 行。"""
    rows = []
    for m in re.finditer(r"^##\s*#?\d*【([^】]+)】\s*(.+)$", findings_text or "", re.M):
        sev = m.group(1).strip()
        title = m.group(2).strip()
        # 从标题里抠用例号
        cids = sorted(set(re.findall(r"[Dd]\s*\d+\s*-\s*[A-Za-z0-9]+|EXP-[A-Za-z0-9-]+", title)))
        case = ",".join(cids) if cids else "—"
        rows.append((case, sev, title[:60]))
    return rows


def extract_issue_nums(links_text):
    nums = set()
    for m in re.finditer(r"\[#(\d+)\]", links_text or ""):
        nums.add(int(m.group(1)))
    return sorted(nums, reverse=True)


def main():
    if len(sys.argv) < 2:
        print("用法: python gen_version_readme.py <版本>  例: v1.1.7")
        sys.exit(2)
    ver = sys.argv[1].strip()
    if not ver.lower().startswith("v"):
        ver = "v" + ver
    os_dirs = find_os_dirs(ver)
    if not os_dirs:
        print(f"未找到 results/version/{ver}/ 下的 OS 归档目录（Windows/Linux）")
        sys.exit(1)

    commit = branch = ""
    tool = env = ""
    design_cnt = Counter()
    expand_cnt = Counter()
    defects = []
    issue_nums = []
    per_os = []

    for osn in os_dirs:
        osd = os.path.join(VDIR, ver, osn)
        rp = pick_report(osd)
        c = b = ""
        if rp:
            txt = open(rp, encoding="utf-8").read()
            c, b = extract_commit_branch(txt)
            if not commit and c:
                commit, branch = c, b
            t2, e2 = extract_tool_env(txt)
            if not tool and t2:
                tool = t2
            if not env and e2:
                env = e2
        dc = stat_csv(os.path.join(osd, "用例矩阵-设计级.csv"))
        ec = stat_csv(os.path.join(osd, "用例矩阵-展开级.csv"))
        if dc:
            design_cnt.update(dc)
        if ec:
            expand_cnt.update(ec)
        fp = os.path.join(osd, "FINDINGS.md")
        if os.path.isfile(fp):
            defects += extract_defects(open(fp, encoding="utf-8").read())
        hl = os.path.join(osd, "HISTORY_LINKS.md")
        if os.path.isfile(hl):
            issue_nums += extract_issue_nums(open(hl, encoding="utf-8").read())
        rep_fn = os.path.basename(rp) if rp else "—"
        per_os.append((osn, rep_fn))

    # 去重缺陷（按 (用例,级别,缺陷) 保留）
    seen = set()
    dedup = []
    for d in defects:
        if d not in seen:
            seen.add(d)
            dedup.append(d)

    def fmt(c):
        return " / ".join(f"{k} {c[k]}" for k in ("PASS", "FAIL", "SPEC-MISMATCH", "BLOCKED", "NOT_RUN") if c.get(k)) or "—"

    denom = design_cnt.get("PASS", 0) + design_cnt.get("FAIL", 0) + design_cnt.get("SPEC-MISMATCH", 0) \
        + expand_cnt.get("PASS", 0) + expand_cnt.get("FAIL", 0) + expand_cnt.get("SPEC-MISMATCH", 0)
    passn = design_cnt.get("PASS", 0) + expand_cnt.get("PASS", 0)
    passtate = f"{round(passn / denom * 100, 1)}%" if denom else "—"

    lines = [f"# 迭代版本 {ver}", "", "## 版本信息", "",
             f"- 稳定版本：`{ver}`（npm latest）",
             f"- 实际测试对象：`{ver}` @ commit `{commit}`（{branch or 'main'}，latest 正式版）" if commit
             else f"- 实际测试对象：`{ver}` @ commit ``（latest 正式版）",
             f"- 工具全集：{tool} 个 MCP 工具" if tool else "- 工具全集：—",
             f"- Node / npm / Python：{env}" if env else "- Node / npm / Python：—",
             "- 测试类型：版本全量测试（母版全量 `init_day --full`），双 OS/单 OS 对照", "",
             "## 执行归档（实质文件）", "",
             "| OS | 归档目录 | 测试报告 | 执行结果 CSV | 缺陷清单 |",
             "|---|---|---|---|---|"]
    for osn, rep_fn in per_os:
        lines.append(f"| {osn} | `results/version/{ver}/{osn}/` | `{rep_fn}` | 设计级/展开级/追踪表 3 CSV | `FINDINGS.md` + `HISTORY_LINKS.md` |")
    lines += ["", "## 执行状态", "",
              f"- 设计级：{fmt(design_cnt)}",
              f"- 展开级：{fmt(expand_cnt)}",
              f"- 通过率（分母=PASS+FAIL+SPEC，不含 NOT_RUN）：{passtate}"]
    if dedup:
        lines += ["", "## 缺陷（均经 file_issue.py 查重，见 HISTORY_LINKS.md）", "",
                  "| 用例 | 级别 | 缺陷 |", "|---|---|---|"]
        for case, sev, title in dedup:
            lines.append(f"| {case} | {sev} | {title} |")
    else:
        lines += ["", "## 缺陷", "", "- 本轮无 FAIL / SPEC-MISMATCH 缺陷。"]
    if issue_nums:
        lines += ["", f"## 历史关联单", "", "- " + ", ".join(f"#{n}" for n in sorted(set(issue_nums), reverse=True)[:15])]
    lines += ["", "## 其他客户端", "", "- 待其余客户端补齐该版本全量后由维护者汇总合并。"]

    out = os.path.join(VDIR, ver, "README.md")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"已生成 {os.path.relpath(out, REPO)}")
    print(f"  版本 {ver} commit={commit or '?'} branch={branch or '?'} 设计级[{fmt(design_cnt)}] 展开级[{fmt(expand_cnt)}] 通过率 {passtate}")


if __name__ == "__main__":
    main()