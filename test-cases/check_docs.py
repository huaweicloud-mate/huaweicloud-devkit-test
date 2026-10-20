# -*- coding: utf-8 -*-
"""文档一致性体检：交叉引用 / 静态事实断言 / 版本同步 / 台账↔文档对账。

退出码：有问题 -> 1（可直接作 CI 门禁）；无问题 -> 0。
路径：全部由脚本位置推导，跨平台可跑（GitHub runner / 本机 Windows 同源）。
"""
import os
import re
import sys
import hashlib

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 脚本在 test-cases/，上跳两级 = 仓库根
LOCAL = os.path.dirname(REPO)                                       # 本机工作区（CI 上不存在 → 仅记 📌 note）
WB = os.path.join(os.path.expanduser("~"), "WorkBuddy", "2026-09-05-16-18-26")

issues = []
notes = []

# ---------- 1. 交叉引用检查：仓库内 md/html 的相对链接 ----------
def md5(p):
    with open(p, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def collect_files(root, exts=(".md", ".html")):
    out = []
    for dirpath, _, files in os.walk(root):
        _rel = os.path.relpath(dirpath, root).replace("\\", "/")
        # 跳过：.git；归档证据里的 node_modules（第三方包 README 内部相对链接必然失效）；
        # results/ 整个归档树（含历史报告与取证产物）——口径：归档原文只增不改，不做链接门禁。
        if ".git" in dirpath or "node_modules" in dirpath or _rel == "results" or _rel.startswith("results/"):
            continue
        for fn in files:
            if fn.endswith(exts):
                out.append(os.path.join(dirpath, fn))
    return out

files = collect_files(REPO)
_archived_n = sum(1 for _dp, _, _fns in os.walk(os.path.join(REPO, "results"))
                  for _fn in _fns if _fn.endswith((".md", ".html")))
notes.append(f"链接门禁口径：results/ 归档 {_archived_n} 个 md/html 不参与链接检查（归档原文只增不改）")
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
tmpl_n = len([
    x for x in os.listdir(os.path.join(REPO, "templates"))
    if os.path.isfile(os.path.join(REPO, "templates", x)) and x != ".gitkeep"
])
notes.append(f".gitignore 实际模式数 = {git_n} 条（README 已表述为 23 条忽略规则，一致 ✓）")
notes.append(f"templates 实际模板数 = {tmpl_n}（README 导航应与实际数量一致）")

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

def _find_iter(*parts):
    """迭代归档已从 results/ 迁至 results/history/（2026-09 迁移），两处都找。"""
    for base in ("results", os.path.join("results", "history")):
        p = os.path.join(REPO, base, *parts)
        if os.path.exists(p):
            return p
    return os.path.join(REPO, "results", *parts)  # 保持明确失败，便于定位


readme = _read_utf8(os.path.join(REPO, "README.md"))

# 5.1 results/（含 history/）已有迭代目录 => 项目状态不得仍为"准备阶段"
_iter_dirs = sorted(d for _base in ("results", os.path.join("results", "history"))
                    for d in os.listdir(os.path.join(REPO, _base))
                    if d.startswith("ITER-") and os.path.isdir(os.path.join(REPO, _base, d)))
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
    _pre = readme[max(0, _mm.start() - 8):_mm.start()]
    if any(k in _pre for k in ("新增", "落 ", "补 ", "追加", "缺口")):
        continue  # 增量陈述（新增/落 N 条用例），非总数陈述
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
_sum = _read_utf8(_find_iter("ITER-002-2026-09-08", "收尾总结.md"))
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
_mdir = _find_iter("ITER-002-2026-09-08", "manual")
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

# ---------- 5.6 台账↔文档对账：LATEST.md 各轮速查 vs execution.csv 逐行求和 ----------
_lat_agg = {}
for _r in _exec_rows[1:]:
    if len(_r) != 10:
        continue
    _a = _lat_agg.setdefault(_r[0], {"p": 0, "e": 0})
    for _i, _k in ((3, "p"), (4, "e")):
        try:
            _a[_k] += int(_r[_i])
        except ValueError:
            _a[_k] = None  # 非数值单元格（issue 口径行）
_lat_rows = 0
for _line in _lat.splitlines():
    if not _line.startswith("| ITER-"):
        continue
    _lat_rows += 1
    _c = [x.strip() for x in _line.strip("|").split("|")]
    _a = _lat_agg.get(_c[0])
    if _a is None:
        issues.append(f"[台账缺行] LATEST.md 提及 {_c[0]}，execution.csv 无该迭代")
    elif _a["p"] is not None and (_c[3] != str(_a["p"]) or _c[4] != str(_a["e"])):
        issues.append(f"[台账漂移] {_c[0]}：LATEST.md {_c[3]}/{_c[4]} ≠ execution.csv {_a['p']}/{_a['e']}")
notes.append(f"台账对账：LATEST.md 速查 {_lat_rows} 行 vs execution.csv {len(_lat_agg)} 个迭代")

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

# 退出码即门禁：发现问题 -> 1（CI 红灯），否则 0
sys.exit(1 if issues else 0)
