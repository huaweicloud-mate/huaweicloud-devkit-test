# -*- coding: utf-8 -*-
"""统一提交 1 个问题单（合并单，附测试报告）。

用法:
    python file_issue.py                          # 默认读 results/总结缺陷汇总
    python file_issue.py <缺陷.md> <版本号>        # 指定缺陷文件 + 版本号

约定（用户红线）:
  - 全量测完才统一提单，勿逐日/逐客户端拆多单
  - 1 个 issue 附测试报告 + 全部缺陷根因
  - 目标仓库 huaweicloud/huaweicloud-devkit（gh 已登录）
"""
import os, sys, re, subprocess

REPO_UPSTREAM = "huaweicloud/huaweicloud-devkit"
REPO_TEST = "huaweicloud-mate/huaweicloud-devkit-test"
REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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

    # 匹配 "## #N【级别】标题" 段落
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
    """从 FINDINGS.md 所在目录找 测试报告.md，生成测试仓库 GitHub 永久链接。"""
    d = os.path.dirname(findings_path)
    if not os.path.isdir(d):
        return ""
    for f in sorted(os.listdir(d)):
        if f.endswith("测试报告.md"):
            rel = os.path.relpath(os.path.join(d, f), REPO)
            return f"https://github.com/{REPO_TEST}/blob/main/{rel.replace(os.sep, '/')}"
    return ""


def main():
    version = sys.argv[2] if len(sys.argv) > 2 else "v1.1.4-next.2"
    path = sys.argv[1] if len(sys.argv) > 1 else None
    if not path:
        # 默认找最近一次执行归档的 FINDINGS.md
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

    title = f"[测试报告] huaweicloud-devkit {version} 全量测试缺陷合并单（{len(items)} 项）"
    report_url = find_report_url(path)
    if report_url:
        print("测试报告链接:", report_url)
    body = build_body(version, items, report_url)
    r = subprocess.run(["gh", "issue", "create", "-R", REPO_UPSTREAM, "--title", title, "--body", body],
                       capture_output=True, text=True, encoding="utf-8", timeout=60)
    if r.returncode == 0:
        print("提单成功:", r.stdout.strip())
    else:
        print("提单失败 rc=", r.returncode, ":", r.stderr.strip()[:400])
        sys.exit(1)


if __name__ == "__main__":
    main()