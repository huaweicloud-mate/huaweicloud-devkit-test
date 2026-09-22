#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""沙箱专项监控失败自动提单（确定性，无 LLM 扩展分析）。

读 sandbox-deploy-monitor.mjs 落盘的 result.json，若存在 FAIL 断言：
  - 查重：读上游 huaweicloud/huaweicloud-devkit open issues，凡标题含固定标记
    「[沙箱监控]」且含相同失败断言名的，视为已上报，不重复提单。
  - 未命中历史单：用 GitHub REST API（token ~/.hdk_token）提一张合并单，
    附失败断言 + 探针原始 JSON 证据，供开发定位。

用法:
    python3 scripts/sandbox_monitor_report.py <result.json> [--dry-run]

无 FAIL 时：打印 PASS，不提单，exit 0。
有 FAIL 但命中历史单：打印「历史单已存在 #N」，exit 0。
有 FAIL 且提新单：打印新 issue URL，exit 0。
token 缺失 / API 报错：打印错误，exit 1。
"""
import json
import os
import sys
import urllib.request
import urllib.error

REPO_UPSTREAM = "huaweicloud/huaweicloud-devkit"
MARKER = "[沙箱监控]"
TOKEN_PATH = os.path.expanduser("~/.hdk_token")


def load_token():
    if os.environ.get("HDK_GH_TOKEN"):
        return os.environ["HDK_GH_TOKEN"].strip()
    if os.path.isfile(TOKEN_PATH):
        with open(TOKEN_PATH, encoding="utf-8") as f:
            t = f.read().strip()
        if t:
            return t
    return None


def _req(method, url, token, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "token " + token)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    return urllib.request.urlopen(req, timeout=60)


def fetch_open_issues(token):
    url = "https://api.github.com/repos/%s/issues?state=open&per_page=100" % REPO_UPSTREAM
    with _req("GET", url, token) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    dry_run = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--dry-run"]
    if len(args) < 1:
        print("用法: python3 scripts/sandbox_monitor_report.py <result.json> [--dry-run]")
        sys.exit(2)

    path = args[0]
    if not os.path.isfile(path):
        print("result.json 不存在:", path)
        sys.exit(2)

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    results = data.get("results", [])
    failed = [r for r in results if not r.get("pass")]
    # 只看连通性/部署断言（C/D 开头），观察告警（W）与 CLOSE 不计入失败
    failed = [r for r in failed if r.get("assert", "").startswith(("C", "D"))]

    if not failed:
        print("PASS：无失败断言，不提单。summary=%s" % json.dumps(data.get("summary", {}), ensure_ascii=False))
        return

    token = load_token()
    if not token:
        print("错误：未找到 GitHub token（HDK_GH_TOKEN / ~/.hdk_token），无法提单。")
        sys.exit(1)

    fail_names = sorted({r.get("assert") for r in failed})
    fail_detail = "\n".join(
        "- **%s**：%s" % (r.get("assert"), r.get("detail", "")) for r in failed
    )

    # 查重：open issues 中标题含标记 + 任一失败断言名
    try:
        issues = fetch_open_issues(token)
    except urllib.error.HTTPError as e:
        print("拉取上游 open issues 失败 HTTP %s：%s" % (e.code, e.read().decode("utf-8", "replace")[:300]))
        sys.exit(1)

    dup = None
    for iss in issues:
        title = iss.get("title", "")
        if MARKER not in title:
            continue
        if any(fn in title for fn in fail_names):
            dup = iss
            break

    if dup:
        print("历史单已存在 #%s（%s），不重复提单。" % (dup.get("number"), dup.get("html_url")))
        return

    issue_title = "%s 沙箱连通性/部署能力异常（%s）" % (MARKER, "、".join(fail_names))
    issue_body = (
        "## 测试概览\n"
        "- 场景：部署 https://gitcode.com/sunzy1940/test 静态网站到华为云沙箱（DevStation）\n"
        "- 用例：沙箱连通性 + 部署能力专项监控（scripts/sandbox-deploy-monitor.mjs）\n"
        "- 结论：**失败**，失败断言 %d 项\n\n"
        "## 失败断言\n\n%s\n\n"
        "## 探针原始证据\n\n```json\n%s\n```\n\n"
        "> 本单由沙箱专项监控自动上报（每 2 小时巡检）。请开发定位修复；修复后可在此单回复或关闭。\n"
    ) % (len(failed), fail_detail, json.dumps(data, ensure_ascii=False, indent=2))

    if dry_run:
        print("[dry-run] 待提单标题:", issue_title)
        print("[dry-run] body 前 500 字:\n" + issue_body[:500])
        return

    try:
        with _req("POST", "https://api.github.com/repos/%s/issues" % REPO_UPSTREAM, token,
                  {"title": issue_title, "body": issue_body}) as resp:
            created = json.loads(resp.read().decode("utf-8"))
        print("提单成功:", created.get("html_url"))
    except urllib.error.HTTPError as e:
        print("提单失败 HTTP %s：%s" % (e.code, e.read().decode("utf-8", "replace")[:400]))
        sys.exit(1)


if __name__ == "__main__":
    main()