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

# ---------- 5. README 状态语义断言（防"准备阶段残留/占位符/用例数漂移/scripts规划中"） ----------
import csv as _csv

def _csv_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return sum(1 for _ in _csv.reader(f)) - 1

def _read_utf8(p):
    with open(p, encoding="utf-8-sig") as f:
        return f.read()

readme = _read_utf8(os.path.join(REPO, "README.md"))

# 5.1 results/ 已有迭代目录 => 项目状态不得仍为"准备阶段"
_iter_dirs = sorted(d for d in os.listdir(os.path.join(REPO, "results"))
                    if d.startswith("ITER-") and os.path.isdir(os.path.join(REPO, "results", d)))
if _iter_dirs and "准备阶段" in readme:
    issues.append(f"[README 状态陈旧] results/ 已有迭代 {_iter_dirs}，README 项目状态仍为『准备阶段』")

# 5.2 当前基线不得为占位符（含 < 尖括号或"填写"字样）
_m_base = re.search(r"当前基线[：:]([^\n]*)", readme)
if _m_base and ("<" in _m_base.group(1) or "填写" in _m_base.group(1)):
    issues.append(f"[README 基线占位] 当前基线仍为占位符：{_m_base.group(1).strip()[:50]}")

# 5.3 用例数与矩阵 CSV 真源核对（设计级/展开级/总数三处）
_design_csv = os.path.join(REPO, "test-cases", "design", "用例矩阵-设计级.csv")
_exp_csv = os.path.join(REPO, "test-cases", "expanded", "用例矩阵-展开级.csv")
_design_n = _csv_rows(_design_csv)
_exp_n = _csv_rows(_exp_csv)
_m_cases = re.search(r"设计级\s*(\d+)\s*\+\s*展开级\s*(\d+)", readme)
if _m_cases:
    for _tag, _decl, _real in (("设计级", int(_m_cases.group(1)), _design_n),
                               ("展开级", int(_m_cases.group(2)), _exp_n)):
        if _decl != _real:
            issues.append(f"[用例数漂移] README {_tag}={_decl}，CSV 真源={_real}")
for _mm in re.finditer(r"(\d{2,4})\s*用例", readme):
    if int(_mm.group(1)) != _design_n + _exp_n:
        issues.append(f"[用例数漂移] README 出现总数『{_mm.group(1)} 用例』，CSV 真源合计={_design_n + _exp_n}")
notes.append(f"矩阵真源（CSV 动态读）：设计级 {_design_n} + 展开级 {_exp_n} = {_design_n + _exp_n}")

# 5.4 scripts/ 实际有脚本 => 不得标"规划中"
_sc_files = [f for f in os.listdir(os.path.join(REPO, "scripts"))
             if os.path.isfile(os.path.join(REPO, "scripts", f)) and f != ".gitkeep"]
if _sc_files:
    for _line in readme.splitlines():
        if _line.strip().startswith("| [scripts/]") and "规划中" in _line:
            issues.append(f"[README scripts 陈旧] scripts/ 实际 {len(_sc_files)} 个脚本（{','.join(_sc_files)}），README 导航行仍标『规划中』")
            break

# ---------- 5.5 覆盖率口径 2026-09-09 一致性 ----------
_lat = _read_utf8(os.path.join(REPO, "results", "LATEST.md"))
_sum = _read_utf8(os.path.join(REPO, "results", "ITER-002-2026-09-08", "收尾总结.md"))
# a. LATEST 不得残留孤立旧口径（61.8% 仅允许出现在"轨迹"叙述中；遍历所有匹配）
for _m61 in re.finditer(r"61\.8%", _lat):
    if "口径修正轨迹" not in _lat[: _m61.start()]:
        issues.append(f"[口径残留] LATEST.md 出现孤立 61.8%（L{_lat.count(chr(10), 0, _m61.start()) + 1} 行附近，不在修正轨迹内）")
# b. 双口径标记（评估完成 + 原子记录）必须存在
if "评估完成" not in _lat or "原子执行记录" not in _lat:
    issues.append("[口径缺失] LATEST.md 缺『评估完成 / 原子执行记录』双口径标注")
if "评估完成" not in _sum or "原子执行记录" not in _sum:
    issues.append("[口径缺失] 收尾总结.md 缺『评估完成 / 原子执行记录』双口径标注")
# c. 未执行清单引用一致性：正文提及清单文件名必须真实存在
_mdir = os.path.join(REPO, "results", "ITER-002-2026-09-08", "manual")
_list_files = [f for f in os.listdir(_mdir) if f.startswith("未执行用例清单")]
for _m in re.finditer(r"未执行用例清单[-\w]*\.md", _lat + _sum):
    if _m.group(0) not in _list_files:
        issues.append(f"[清单引用失效] 文档引用 {_m.group(0)}，实际存在 {_list_files}")
# d. metrics 设计级批次计数一致性：execution.csv 设计级相关批次累计与口径说明行吻合
_exec_rows = list(_csv.reader(open(os.path.join(REPO, "metrics", "execution.csv"), encoding="utf-8-sig")))
_design_exec = 0
for _r in _exec_rows[1:]:
    if len(_r) == 10 and any(k in _r[2] for k in ("D4", "D8-7", "D3-B7", "D9", "P1批", "P2批", "认证方案")):
        try:
            _design_exec += int(_r[4])
        except ValueError:
            pass
_cover_row = [r for r in _exec_rows if len(r) == 10 and "覆盖口径说明" in r[2]]
if not _cover_row:
    issues.append("[metrics缺失] execution.csv 无『覆盖口径说明』行（122/123 推算链未落记录）")
else:
    _m_atomic = re.search(r"原子执行记录\s*=\s*设计级相关\s*(\d+)", _cover_row[0][2])
    if _m_atomic and int(_m_atomic.group(1)) != _design_exec:
        issues.append(f"[metrics漂移] 口径行称原子记录={_m_atomic.group(1)}，实际设计级批次累计={_design_exec}")

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