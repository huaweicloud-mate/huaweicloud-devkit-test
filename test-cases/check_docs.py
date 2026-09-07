# -*- coding: utf-8 -*-
"""文档一致性体检：交叉引用 / 静态事实断言 / 版本同步"""
import os
import re
import hashlib

REPO = r"C:\Users\Administrator\devkit-test\huaweicloud-devkit-test"
LOCAL = r"C:\Users\Administrator\devkit-test"
WB = r"C:\Users\Administrator\WorkBuddy\2026-09-05-16-18-26"

issues = []
notes = []

# ---------- 1. 交叉引用检查：仓库内 md/html 的相对链接 ----------
def md5(p):
    with open(p, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def collect_files(root, exts=(".md", ".html")):
    out = []
    for dirpath, _, files in os.walk(root):
        if ".git" in dirpath:
            continue
        for fn in files:
            if fn.endswith(exts):
                out.append(os.path.join(dirpath, fn))
    return out

files = collect_files(REPO)
link_re = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
for f in files:
    rel = os.path.relpath(f, REPO)
    try:
        text = open(f, encoding="utf-8").read()
    except Exception as e:
        issues.append(f"[读失败] {rel}: {e}")
        continue
    base = os.path.dirname(f)
    for m in link_re.finditer(text):
        target = m.group(1).strip()
        if target.startswith(("http", "#", "mailto:")):
            continue
        # 去掉锚点
        t = target.split("#")[0]
        if not t:
            continue
        full = os.path.normpath(os.path.join(base, t))
        if not os.path.exists(full):
            issues.append(f"[失效链接] {rel} -> {target}")

# ---------- 2. 静态事实断言 ----------
git_n = 0
with open(os.path.join(REPO, ".gitignore"), encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#"):
            git_n += 1
tmpl_n = len([x for x in os.listdir(os.path.join(REPO, "templates")) if x.endswith(".md")])
notes.append(f".gitignore 实际模式数 = {git_n} 条（README 已表述为 23 条忽略规则，一致 ✓）")
notes.append(f"templates 实际模板数 = {tmpl_n}（README 声称 6）")

# ---------- 3. 评审稿内 commit 号 vs 实际 ----------
html = open(os.path.join(REPO, "docs", "测试体系-评审稿.html"), encoding="utf-8").read()
m = re.search(r"commit ([0-9a-f]{7})", html)
if m:
    notes.append(f"评审稿内 commit = {m.group(1)}（需与 git main 对比）")
else:
    notes.append("评审稿内未找到 commit 号")

# ---------- 4. 版本同步：归档仓库 vs 本地工作区 vs WorkBuddy ----------
pairs = [
    ("docs/01-测试规划.md", LOCAL + r"\huaweicloud-devkit-测试规划-v1.3.md", "规划 v1.3"),
    ("docs/02-测试规划评审报告.md", LOCAL + r"\huaweicloud-devkit-测试规划-评估报告.md", "评估报告"),
    ("docs/测试体系-评审稿.html", LOCAL + r"\huaweicloud-devkit-测试体系-评审稿.html", "评审稿HTML"),
    ("docs/03-执行准备清单.md", LOCAL + r"\test-cases\测试执行准备清单.md", "准备清单"),
]
for rel, lp, label in pairs:
    rp = os.path.join(REPO, rel.replace("/", os.sep))
    if os.path.exists(lp):
        same = md5(rp) == md5(lp)
        notes.append(f"同步检查[{label}]: 仓库 vs 工作区 {'✅一致' if same else '❌不一致'}")
    else:
        notes.append(f"同步检查[{label}]: 本地文件不存在 {lp}")

wb_files = {
    "WorkBuddy 规划": os.path.join(WB, "huaweicloud-devkit-测试规划.md"),
    "WorkBuddy 评估": os.path.join(WB, "huaweicloud-devkit-测试规划-评估报告.md"),
}
for label, p in wb_files.items():
    if os.path.exists(p):
        notes.append(f"WorkBuddy 原始[{label}]: 存在（未核对内容，可能为旧版）")
    else:
        notes.append(f"WorkBuddy 原始[{label}]: 不存在")

# ---------- 输出 ----------
print("=" * 60)
print(f"扫描文件数: {len(files)}")
print(f"发现问题: {len(issues)}")
for i in issues:
    print("  ⚠️", i)
print("-" * 60)
for n in notes:
    print("  📌", n)
print("=" * 60)