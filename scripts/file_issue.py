# -*- coding: utf-8 -*-
"""统一提交问题单（合并单，附测试报告）+ 历史 issue 查重与关联。

用法:
    python file_issue.py                           # 默认读 results/总结缺陷汇总
    python file_issue.py <缺陷.md> <版本号>         # 指定缺陷文件 + 版本号
    python file_issue.py <缺陷.md> <版本号> --dry-run        # 只查重/预览，不真正提单
    python file_issue.py <缺陷.md> <版本号> --comment-duplicates  # 对命中的历史单追加复核评论
    python file_issue.py <缺陷.md> <版本号> --type=daily|version|regression  # 测试类型（默认 daily，决定标题后缀）

约定（用户红线）:
  - 全量测完才统一提单，勿逐日/逐客户端拆多单
  - 1 个 issue 附测试报告 + 全部缺陷根因
  - 目标仓库 huaweicloud/huaweicloud-devkit（gh 已登录）
  - 【关键检查】提单前必须查上游仓历史 issue：命中即「历史问题」，不重复开单，
    输出关联清单（历史单号 + 单子内容），避免同类问题重复提单堆积。

查重分级:
  - 强关联：历史单「标题」含该用例号 D4-x，或标题含语义关键词，或正文中该用例号
    附近出现缺陷语义（FAIL/未拦截/绕过/穿透/不脱敏/根因…）= 明确历史缺陷
  - 弱关联：用例号仅出现在正文、且无缺陷语义（可能是「通过」记录）= 不据此判历史缺陷
  - 仅「强关联」命中 => 判为历史问题，不重复提单。
"""
import os, sys, re, subprocess, json

REPO_UPSTREAM = "huaweicloud/huaweicloud-devkit"
REPO_TEST = "huaweicloud-mate/huaweicloud-devkit-test"
REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 用例语义 -> 兜底关键词（用例号在历史单标题中未命中时，用语义关键词做强关联兜底）
CASE_KEYWORD_MAP = {
    "D4-2":  ["echo", "env-dump", "env dump", "printenv", "凭证打印", "凭证 env", "环境变量打印", "凭证环境变量", "HW_ 前缀", "前缀漏网", "前缀未覆盖"],
    "D4-15": ["url 编码", "%20", "url编码", "引号包裹", "hcloud%20"],
    "D4-16": ["sh -c", "bash -c", "包裹", "wrapper", "穿透", "cmd /c", "shell 包裹", "引号内命令", "命令替换", "命令包裹"],
    "D2-4":  ["脱敏", "小写", "redact", "不脱敏", "sk 明文", "ak/sk", "ak=", "obsutilconfig"],
    "D4-3":  ["adminpass", "password=", "明文 secret", "show-secret", "secret 参数", "DecryptData", "Decrypt"],
    "D4-8":  ["python/node", "python 钩子", "node 钩子", "钩子策略", "策略不一致", "钩子实现不一致"],
    "D4-17": ["fail-open", "fail open", "fail-closed", "畸形输入", "异常输入"],
    "D4-21": ["broad IAM", "broad iam", "Terraform", "HCL", "制品预检", "hook_check_artifacts"],
    "D4-23": ["huawei-agent-rules", "全局规则", "注入失效", "安装未注入", "安装目标"],
    "D9-2":  ["json-rpc", "json rpc", "-32601", "-32603", "错误码"],
}

# 测试类型 -> issue 标题后缀（file_issue.py 被每日/版本全量/回归三种能力共用，标题据此动态生成）
TEST_TYPE_LABELS = {
    "daily": "每日测试",       # skills/test-execution
    "version": "版本全量测试",  # skills/test-version
    "regression": "回归测试",   # skills/test-regression
}

# 正文中判断「用例号是作为缺陷提出的」的信号词
DEFECT_HINT = [
    "fail", "allow", "未拦截", "未覆盖", "绕过", "穿透", "不脱敏", "缺陷", "根因",
    "零覆盖", "无规则", "误判", "遗漏", "actual", "no-rule", "deny",
]


def parse_findings(path):
    """从 FINDINGS.md 解析缺陷：返回 [{num, sev, title, 现象, 断言, 根因, 影响, 证据}]，跳过非产品缺陷段。"""
    if not os.path.isfile(path):
        print(f"缺陷文件不存在: {path}")
        sys.exit(2)
    text = open(path, encoding="utf-8").read()
    items = []

    def grab(field, seg):
        r = re.search(r"[-*]\s*\*\*" + field + r"[^*]*\*\*[：:]\s*(.+)", seg)
        return r.group(1).strip() if r else ""

    for m in re.finditer(r"^## #(\d+)【([^】]+)】(.+)$", text, re.M):
        num, sev, title = m.group(1), m.group(2), m.group(3).strip()
        seg = text[m.end():]
        nxt = re.search(r"^## ", seg, re.M)
        seg = seg[:nxt.start()] if nxt else seg
        if re.search(r"非产品缺陷|测试侧|不予提单", sev):
            continue
        items.append({
            "num": num, "sev": sev, "title": title,
            "现象": grab("现象", seg),
            "断言": grab("断言", seg),
            "根因": grab("根因", seg),
            "影响": grab("影响", seg),
            "证据": grab("证据", seg),
        })
    return items


def extract_case_ids(text):
    """从文本提取用例号 D4-16 / D2-4 / D1-39 等，统一大写、去空格。"""
    if not text:
        return set()
    ids = set()
    for m in re.findall(r"[Dd]\s*\d+\s*[-–—]\s*\d+", text):
        ids.add(re.sub(r"\s*[-–—]\s*", "-", m).upper())
    return ids


def fetch_upstream_issues(state="open", limit=300):
    """拉取上游仓 issues（标题+正文+状态+编号），排除 PR。"""
    r = subprocess.run(
        ["gh", "issue", "list", "-R", REPO_UPSTREAM, "--state", state,
         "--limit", str(limit), "--json", "number,title,body,state,url"],
        capture_output=True, text=True, encoding="utf-8", timeout=120,
    )
    if r.returncode != 0:
        print(f"拉取上游 issue 失败 rc={r.returncode}: {r.stderr.strip()[:300]}")
        return []
    try:
        data = json.loads(r.stdout)
    except json.JSONDecodeError:
        print("解析上游 issue JSON 失败")
        return []
    return [d for d in data if "body" in d]


def _dedup(issues):
    seen, out = set(), []
    for iss in sorted(issues, key=lambda x: -x["number"]):
        if iss["number"] not in seen:
            seen.add(iss["number"])
            out.append(iss)
    return out


def _ids_in_defect_context(issue, ids):
    """判断这些用例号在 issue 正文中是否「作为缺陷提出」（附近出现缺陷语义信号词）。"""
    body = (issue.get("body") or "").lower()
    title = (issue.get("title") or "").lower()
    def has_hint(text_window):
        return any(h in text_window for h in DEFECT_HINT)
    for cid in ids:
        # 标题命中缺陷语义也算
        if cid.lower() in title and has_hint(title):
            return True
        for m in re.finditer(re.escape(cid.lower()), body):
            s = max(0, m.start() - 120)
            e = min(len(body), m.end() + 120)
            if has_hint(body[s:e]):
                return True
    return False


def _kw_in_text(kws, text):
    """任一关键词命中文本（大小写不敏感）。"""
    tl = text.lower()
    return any(k and k.lower() in tl for k in kws)


def _kw_near_defect(iss, kws):
    """关键词在 issue 正文中出现的位置附近是否有缺陷语义信号（FAIL/未拦截/绕过…）。"""
    body = (iss.get("body") or "").lower()
    for kw in kws:
        if not kw:
            continue
        for m in re.finditer(re.escape(kw.lower()), body):
            s = max(0, m.start() - 120)
            e = min(len(body), m.end() + 120)
            if any(h in body[s:e] for h in DEFECT_HINT):
                return True
    return False


def match_history(item, issues):
    """判断单个缺陷是否命中历史 issue。返回 (strong, weak)。

    strong = 明确历史缺陷（标题/正文含用例号或根因关键词；正文命中且附近有缺陷语义）
    weak   = 仅在正文出现、且无缺陷语义（不据此判历史缺陷）
    """
    hay = " ".join(filter(None, [item.get("现象", ""), item.get("根因", ""), item.get("证据", ""), item.get("title", "")]))
    ids = extract_case_ids(hay)
    # 关键词：① 用例号映射 ② hay 直接命中（不依赖用例号，FINDINGS 未写 D4-x 时仍能匹配）
    kws = set()
    for cid in ids:
        kws.update(CASE_KEYWORD_MAP.get(cid, []))
    hay_lower = hay.lower()
    for words in CASE_KEYWORD_MAP.values():
        for w in words:
            if w and w.lower() in hay_lower:
                kws.add(w)

    strong, weak = [], []
    for iss in issues:
        title = (iss["title"] or "")
        body = (iss.get("body") or "")
        title_ids = extract_case_ids(title)
        body_ids = extract_case_ids(body)
        # 强关联1：标题含用例号 或 关键词
        if (ids & title_ids) or _kw_in_text(kws, title):
            strong.append(iss)
        # 强关联2：正文含用例号 或 关键词，且附近有缺陷语义
        elif (ids & body_ids) or _kw_in_text(kws, body):
            if _ids_in_defect_context(iss, ids) or _kw_near_defect(iss, kws):
                strong.append(iss)
            else:
                weak.append(iss)
    return _dedup(strong), _dedup(weak)


def build_body(version, items, report_url=""):
    lines = [
        "## 测试概览",
        f"- 被测版本：{version}",
        f"- 缺陷：{len(items)} 项",
        "",
        "## 缺陷清单",
        "",
    ]
    for it in items:
        lines.append(f"### {it['num']}. [{it['sev']}] {it['title']}")
        if it["现象"]:
            lines.append(f"- **描述**：{it['现象']}")
        if it["断言"]:
            lines.append(f"- **预期（精确断言）**：{it['断言']}")
        if it["根因"]:
            lines.append(f"- **根因**：{it['根因']}")
        if it["证据"]:
            lines.append(f"- **证据**：{it['证据']}")
        if it["影响"]:
            lines.append(f"- **影响**：{it['影响']}")
        lines.append("")
    if report_url:
        lines.append(f"**测试报告**：{report_url}")
    return "\n".join(lines)


def find_report_url(findings_path):
    d = os.path.dirname(findings_path)
    if not os.path.isdir(d):
        return ""
    for f in sorted(os.listdir(d)):
        if f.endswith("测试报告.md"):
            rel = os.path.relpath(os.path.join(d, f), REPO)
            return f"https://github.com/{REPO_TEST}/blob/main/{rel.replace(os.sep, '/')}"
    return ""


def render_history_report(hist_items):
    """生成「历史问题关联清单」—— 命中历史单的缺陷不重复提单，此处列出关联单号+内容。"""
    lines = ["# 历史问题关联清单（不重复提单）", "",
             "> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。", ""]
    for it in hist_items:
        lines.append(f"## {it['title']}")
        lines.append(f"- 今日证据：{it.get('证据', '') or it.get('现象', '')}")
        strong, weak = it["_hits"]
        if strong:
            lines.append("- **关联历史单（已作为缺陷提过，本次为复核）**：")
            for h in strong:
                link = h.get("url") or f"https://github.com/{REPO_UPSTREAM}/issues/{h['number']}"
                lines.append(f"  - [#{h['number']}]({link})（{h['state'].lower()}）**{h['title']}**")
                body = (h.get("body") or "").strip()
                if body:
                    preview = re.sub(r"\s+", " ", body)[:200]
                    lines.append(f"    - 历史单内容：{preview}")
        if weak:
            nums = ", ".join(f"#{h['number']}" for h in weak)
            lines.append(f"- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：{nums}")
        lines.append("")
    return "\n".join(lines)


def main():
    dry_run = "--dry-run" in sys.argv
    comment_dup = "--comment-duplicates" in sys.argv
    test_type = "daily"
    for a in sys.argv[1:]:
        if a.startswith("--type="):
            test_type = a.split("=", 1)[1].strip()
    type_label = TEST_TYPE_LABELS.get(test_type, TEST_TYPE_LABELS["daily"])
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    version = args[1] if len(args) > 1 else "v1.1.4-next.2"
    path = args[0] if len(args) > 0 else None
    if not path:
        import glob
        cands = sorted(glob.glob(os.path.join(REPO, "results", "ITER-*", "FINDINGS.md")), reverse=True)
        if not cands:
            print("未找到 FINDINGS.md，请显式传路径: python file_issue.py <缺陷.md> <版本>")
            sys.exit(2)
        path = cands[0]

    items = parse_findings(path)
    if not items:
        print("未解析到缺陷（无 ## #N 标题）。")
        sys.exit(2)

    print(f"解析到 {len(items)} 项缺陷:")
    for it in items:
        print(f"  #{it['num']} [{it['sev']}] {it['title']}")

    # 【关键检查】历史 issue 查重
    print(f"\n正在查上游仓 {REPO_UPSTREAM} 历史 issue ...")
    issues = fetch_upstream_issues(state="open")
    if not issues:
        print("⚠️ 未拉到历史 issue（可能网络/认证问题），本次不执行查重，继续提单。")
    new_items, hist_items = [], []
    for it in items:
        strong, weak = match_history(it, issues) if issues else ([], [])
        it["_hits"] = (strong, weak)
        (hist_items if strong else new_items).append(it)

    # 输出历史问题关联清单
    if hist_items:
        print("\n" + "=" * 66)
        print(f"【历史问题】{len(hist_items)} 项命中历史缺陷单，不重复提单：")
        for it in hist_items:
            strong, weak = it["_hits"]
            print(f"  ▪ {it['title']}")
            for h in strong:
                print(f"      ↳ #{h['number']} [{h['state'].lower()}] {h['title']}")
            if weak:
                print(f"      ↳ （正文另有提及 #: {', '.join('#'+str(h['number']) for h in weak)}）")
        print("=" * 66)
        hist_md = render_history_report(hist_items)
        out_md = os.path.join(os.path.dirname(path), "HISTORY_LINKS.md")
        with open(out_md, "w", encoding="utf-8") as f:
            f.write(hist_md)
        print(f"关联清单已写: {out_md}")

        if comment_dup:
            for it in hist_items:
                strong, _ = it["_hits"]
                if not strong:
                    continue
                top = strong[0]
                comment = (
                    f"{type_label}复核（{version}）：本问题仍复现。\n"
                    f"- 今日发现：{it['title']}\n"
                    f"- 证据：{it.get('证据', '')}\n"
                    f"- 根因：{it.get('根因', '')}\n"
                )
                r = subprocess.run(
                    ["gh", "issue", "comment", str(top["number"]), "-R", REPO_UPSTREAM, "--body", comment],
                    capture_output=True, text=True, encoding="utf-8", timeout=60,
                )
                print(f"  评论 #{top['number']}: {'成功' if r.returncode == 0 else '失败 ' + r.stderr.strip()[:200]}")

    # 新问题提单
    if not new_items:
        print("\n无新问题（全部为历史问题），跳过提单。")
        return
    title = f"[测试报告] huaweicloud-devkit {version} {type_label}缺陷合并单（{len(new_items)} 项）"
    report_url = find_report_url(path)
    if report_url:
        print("测试报告链接:", report_url)
    body = build_body(version, new_items, report_url)
    print(f"\n待提单（新问题 {len(new_items)} 项）: {title}")
    if dry_run:
        print("--- dry-run，issue body 预览 ---")
        print(body)
        print("--- 预览结束（未真正提单）---")
        return
    r = subprocess.run(
        ["gh", "issue", "create", "-R", REPO_UPSTREAM, "--title", title, "--body", body],
        capture_output=True, text=True, encoding="utf-8", timeout=60,
    )
    if r.returncode == 0:
        print("提单成功:", r.stdout.strip())
    else:
        print("提单失败 rc=", r.returncode, ":", r.stderr.strip()[:400])
        sys.exit(1)


if __name__ == "__main__":
    main()