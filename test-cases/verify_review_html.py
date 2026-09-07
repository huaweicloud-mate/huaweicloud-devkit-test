# -*- coding: utf-8 -*-
"""验证评审稿 HTML 内容完整性（行数断言改为动态读取 CSV，避免手工同步）"""
import re
import csv

p = r"C:\Users\Administrator\devkit-test\huaweicloud-devkit-测试体系-评审稿.html"
html = open(p, encoding="utf-8").read()

# 动态统计：设计级/展开级实际行数（以 CSV 为准）
def csv_rows(path):
    with open(path, encoding="utf-8-sig") as f:
        return sum(1 for _ in csv.reader(f)) - 1

n_design = csv_rows(r"C:\Users\Administrator\devkit-test\test-cases\huaweicloud-devkit-用例矩阵-设计级.csv")
n_expanded = csv_rows(r"C:\Users\Administrator\devkit-test\test-cases\huaweicloud-devkit-用例矩阵-展开级.csv")

# 动态统计优先级分布（与 gen_review_html.py 口径一致：设计+展开合计）
from collections import Counter
def prio_counts(*paths):
    c = Counter()
    for p in paths:
        with open(p, encoding="utf-8-sig") as f:
            c.update(r["优先级"] for r in csv.DictReader(f))
    return c

_pc = prio_counts(
    r"C:\Users\Administrator\devkit-test\test-cases\huaweicloud-devkit-用例矩阵-设计级.csv",
    r"C:\Users\Administrator\devkit-test\test-cases\huaweicloud-devkit-用例矩阵-展开级.csv",
)
n_p0 = _pc["P0"]
n_p1 = _pc["P1"]
n_p2 = _pc["P2"]

checks = {
    "文档闭合</html>": html.rstrip().endswith("</html>"),
    "设计级用例行数匹配CSV": len(re.findall(r"<td class='mono'>D\d", html)) == n_design,
    "展开级用例行数匹配CSV": len(re.findall(r"<td class='mono'>EXP-", html)) == n_expanded,
    "D10-8最后用例存在": "D10-8" in html,
    "EXP-E15评测集最后条": "EXP-E15" in html,
    "评审决策点": "本次评审请关注" in html,
    "归档仓库链接": "huaweicloud-mate/huaweicloud-devkit-test" in html,
    "统计卡片总数": f">{n_design + n_expanded}<" in html,
    "P0卡片数量": f'style="color:#d92d20">{n_p0}<' in html,
    "P1卡片数量": f'style="color:#e8820c">{n_p1}<' in html,
    "P2卡片数量": f'style="color:#7a869a">{n_p2}<' in html,
    "CSS内联无外部依赖": "http://" not in html and "https://" not in html.replace("https://github.com/huaweicloud-mate/huaweicloud-devkit-test", ""),
    "目录13项": html.count('<li><a href="#s') == 13,
    "导航固定定位": "nav.toc { position: fixed; top: 0; left: 0; right: 0; z-index: 1000;" in html,
    "导航标题📋目录": "toc-title\">📋 目录" in html,
    "正文顶部留白": "body { padding-top: 56px; }" in html,
    "锚点避让scroll-margin": "scroll-margin-top: 66px" in html,
    "导航14项链接": html.count('<li><a href="#s') + (1 if 'href="#review"' in html else 0) == 14,
    "打印隐藏导航+去留白": "nav.toc { display: none; }" in html and "body { background: #fff; padding-top: 0; }" in html,
    "归档目录树渲染": 'huaweicloud-mate/huaweicloud-devkit-test  (PRIVATE · main)' in html and '├── docs/' in html,
    "目录树关键节点": all(x in html for x in ['01-测试规划.md', 'gen_matrix.py', 'nightly-report.md', 'ITER-001-2026-09-05', 'eval-set-v1.csv', '─ 用例矩阵-设计级.csv']),
    "11.1目录结构小节": "11.1 目录结构（远程验证版）" in html,
}
ok = True
for k, v in checks.items():
    print(("PASS" if v else "FAIL"), k)
    ok = ok and v
trs = html.count("<tr>")
print("总<tr>标签数:", trs)
print("CSV 实际行数: 设计级 =", n_design, "| 展开级 =", n_expanded)
print("文件大小:", f"{len(html)/1024:.1f} KB")
assert ok, "存在 FAIL 项"
print("ALL CHECKS PASSED")