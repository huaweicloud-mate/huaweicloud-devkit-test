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


def parse_findings(path):
    """从 FINDINGS.md 解析缺陷：返回 [(标题, 根因摘要)]，跳过「阻塞项」「测试侧修正」非缺陷段。"""
    if not os.path.isfile(path):
        print(f"缺陷文件不存在: {path}")
        sys.exit(2)
    text = open(path, encoding="utf-8").read()
    items = []
    # 匹配 "## #N【级别】标题" 段落
    for m in re.finditer(r"^## #(\d+)【([^】]+)】(.+)$", text, re.M):
        num, sev, title = m.group(1), m.group(2), m.group(3).strip()
        # 抓取该段落内第一行「根因」或「现象」
        seg = text[m.end():]
        nxt = re.search(r"^## ", seg, re.M)
        seg = seg[:nxt.start()] if nxt else seg
        # 过滤非产品缺陷：只看 sev（标题【】内显式标记），不扫段落——段落里"非产品缺陷"可能指别的
        if re.search(r"非产品缺陷|测试侧|不予提单", sev):
            continue
        root = re.search(r"[-*]\s*\*\*根因[^*]*\*\*[：:]\s*(.+)", seg)
        if not root:
            root = re.search(r"[-*]\s*\*\*现象\*\*[：:]\s*(.+)", seg)
        if not root:
            root = re.search(r"[-*]\s*\*\*影响\*\*[：:]\s*(.+)", seg)
        root_txt = root.group(1).strip() if root else "(见证据)"
        items.append((num, sev, title, root_txt))
    return items


def build_body(version, items):
    lines = [
        f"## 测试概览",
        f"- 被测版本：{version}",
        f"- 缺陷：{len(items)} 项（根因见正文）",
        "",
        "## 缺陷清单",
        "",
    ]
    for num, sev, title, root in items:
        lines.append(f"### {sev} · {title}")
        if root:
            lines.append(f"- 根因：{root}")
        lines.append("")
    lines.append("> 详细根因、源码行号、证据见测试报告（results/ITER-XXX-*/FINDINGS.md + 测试报告.md）。")
    return "\n".join(lines)


def main():
    version = sys.argv[2] if len(sys.argv) > 2 else "v1.1.4-next.2"
    path = sys.argv[1] if len(sys.argv) > 1 else None
    if not path:
        # 默认找最近一次执行归档的 FINDINGS.md
        import glob
        cands = sorted(glob.glob(os.path.join("results", "ITER-*", "FINDINGS.md")), reverse=True)
        if not cands:
            print("未找到 FINDINGS.md，请显式传路径: python file_issue.py <缺陷.md> <版本>")
            sys.exit(2)
        path = cands[0]
    items = parse_findings(path)
    if not items:
        print("未解析到缺陷（无 ## #N 标题）。")
        sys.exit(2)
    print(f"解析到 {len(items)} 项缺陷:")
    for num, sev, title, _ in items:
        print(f"  #{num} [{sev}] {title}")

    title = f"[测试报告] huaweicloud-devkit {version} 全量测试缺陷合并单（{len(items)} 项）"
    body = build_body(version, items)
    r = subprocess.run(["gh", "issue", "create", "-R", REPO_UPSTREAM, "--title", title, "--body", body],
                       capture_output=True, text=True, encoding="utf-8", timeout=60)
    if r.returncode == 0:
        print("提单成功:", r.stdout.strip())
    else:
        print("提单失败 rc=", r.returncode, ":", r.stderr.strip()[:400])
        sys.exit(1)


if __name__ == "__main__":
    main()