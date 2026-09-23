#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""历史查重：用 ~/.hdk_token 直查 GitHub API，核对昨日关联的上游 issue 是否仍 open。"""
import json, os, urllib.request

TOKEN = open(os.path.expanduser("~/.hdk_token")).read().strip()
REPO = "huaweicloud/huaweicloud-devkit"

ISSUES = {
    "D4-16": [682, 752, 761, 797],
    "D2-4":  [694, 674, 791],
    "D4-23": [679, 752, 761],
    "D4-27": [726, 752, 791],
    "D8-4":  [694],
    "D9-2":  [752, 730],
    "D9-9":  [698, 774],
    "D10-3": [705, 689, 785],
    "D3-S1": [705, 762],
    "D3-S3": [767, 762, 787],
    "D3-S5": [767, 751, 788],
    "D1-68": [765],
    "D4-25": [752],
    "D4-26": [761, 791],
    "D8-9":  [752, 674],
}

def get_issue(n):
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/issues/{n}",
        headers={"Authorization": f"token {TOKEN}", "User-Agent": "hdk-test", "Accept": "application/vnd.github+json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

nums = sorted({n for v in ISSUES.values() for n in v})
print(f"待核对 issue 数: {len(nums)}")
for n in nums:
    try:
        d = get_issue(n)
        print(f"  #{n} state={d.get('state')} is_pr={'pull_request' in d} | {str(d.get('title'))[:70]}")
    except Exception as e:
        print(f"  #{n} ERROR: {e}")

# 拉取 open issue 列表（用于确认总数）—— 只取编号/标题
try:
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/issues?state=open&per_page=100",
        headers={"Authorization": f"token {TOKEN}", "User-Agent": "hdk-test", "Accept": "application/vnd.github+json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    issues = [d for d in data if "pull_request" not in d]
    print(f"\nopen issues (page1, 非PR): {len(issues)} 条")
except Exception as e:
    print(f"拉取 open issues 失败: {e}")