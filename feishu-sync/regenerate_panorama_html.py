# -*- coding: utf-8 -*-
"""regenerate_panorama_html.py - 刷新测试全景图 HTML 到仓库母版最新(设计级 205 + 展开级 137)

数据驱动: 母版 CSV + 全景图 xlsx 为真源。精准替换文本 + 重建三个数据块
(维度分布表 / 条形图 / 执行状态表)。历史迭代记录保留不动。
"""
import csv
import io
from collections import Counter

import openpyxl

XLSX = r'C:\Users\Administrator\devkit-test\test manage\huaweicloud-devkit-测试全景图.xlsx'
HTML = r'C:\Users\Administrator\devkit-test\test manage\huaweicloud-devkit-测试全景图.html'
BASE = r'C:\Users\Administrator\devkit-test\huaweicloud-devkit-test\test-cases'

DIMS = ['D1安装', 'D2认证', 'D3功能', 'D4安全', 'D5客户端',
        'D6性能', 'D7兼容', 'D8质量', 'D9协议', 'D10评测']
DIM_SHORT = {'D1安装': 'D1', 'D2认证': 'D2', 'D3功能': 'D3', 'D4安全': 'D4',
             'D5客户端': 'D5', 'D6性能': 'D6', 'D7兼容': 'D7', 'D8质量': 'D8',
             'D9协议': 'D9', 'D10评测': 'D10'}
DIM_SCOPE = {
    'D1安装': '安装 / 引导 / doctor / update / uninstall 生命周期',
    'D2认证': 'AK/SK 方案 v4、reconcile、指纹、多源仲裁',
    'D3功能': 'Skills + MCP 工具覆盖，含 C4 服务矩阵展开 22',
    'D4安全': '审批门 / 写误判 / 凭证拦截 / 规则覆盖（最高权重）',
    'D5客户端': '多 Agent 适配，含客户端矩阵展开 70',
    'D6性能': '并发 / 响应 / 弹性',
    'D7兼容': 'Windows / Linux / macOS 跨平台',
    'D8质量': '可观测性 / 文档 / 内容质量',
    'D9协议': 'MCP 协议合规（对标 Azure / Microsoft 三层模型）',
    'D10评测': 'Agent 行为：召回 / 激活 / 路由 / 安全干预（评测任务 15）',
}


def read_csv(p):
    with io.open(p, 'r', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def dim_name(d):
    return d[len(DIM_SHORT[d]):] if d.startswith(DIM_SHORT[d]) else d


design = read_csv(BASE + r'\design\用例矩阵-设计级.csv')
expanded = read_csv(BASE + r'\expanded\用例矩阵-展开级.csv')
n_design = len(design)
n_expanded = len(expanded)

dim_cnt = Counter(r['维度'].strip() for r in design)
prio = Counter(r['优先级'].strip() for r in design)

# 执行状态分布（xlsx 维度 × 执行状态）
wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb['测试矩阵-设计级']
status_dim = {d: Counter() for d in DIMS}
status_total = Counter()
for row in ws.iter_rows(min_row=3, values_only=True):
    if not row or row[1] is None:
        continue
    dim = str(row[1]).strip()
    st = str(row[12]).strip() if len(row) > 12 and row[12] is not None else ''
    st = st or '待执行'
    status_total[st] += 1
    if dim in status_dim:
        status_dim[dim][st] += 1
wb.close()

html = io.open(HTML, 'r', encoding='utf-8').read()
notes = []


def rep(old, new, tag):
    global html
    c = html.count(old)
    if c == 0:
        notes.append('!! 未找到[%s]' % tag)
    else:
        html = html.replace(old, new)
        notes.append('OK[%s] x%d' % (tag, c))


# ---- 头部 / KPI ----
rep('数据快照 2026-09-10（ITER-004 NR3 版本升级提醒 + issues 回归）',
    '数据快照 2026-09-21（仓库母版回流：设计级 205 + 展开级 137）', 'kicker')
rep('用例 245 = 设计级 138（含 NR3 新增 15）+ 展开级 107',
    '用例 342 = 设计级 %d + 展开级 %d' % (n_design, n_expanded), 'chip 用例数')
rep('>245<small', '>342<small', 'KPI num')
rep('用例库 = 设计级 138（含 NR3 新增 15）+ 展开级 107',
    '用例库 = 设计级 %d + 展开级 %d' % (n_design, n_expanded), 'KPI lab')
rep('设计级 138/138 评估完成（ITER-003 123/123 + NR3 新增 15/15 全执行留痕）；metrics 原子执行记录 +=25 条次（NR3 15 + 回归 9 + 探针批次）',
    '设计级 %d 定义（138 已评估 = 通过 129 + 缺陷观察 8 + 环境缺口 1；新增 67 待执行；仓库母版回流）' % n_design, 'KPI 设计级口径')

# ---- 十维度 h2 / tag ----
rep('十维度定义与用例分布（设计级 138 条 · CSV 真源）',
    '十维度定义与用例分布（设计级 %d 条 · CSV 真源）' % n_design, '十维 h2')
rep('P0 18 / P1 73 / P2 47',
    'P0 %d / P1 %d / P2 %d' % (prio.get('P0', 0), prio.get('P1', 0), prio.get('P2', 0)), '优先级 tag')

# ---- 维度分布表(重建) ----
tbl_start = html.index('<table data-page-node-id="ypXG9dz1aMR48PrHtHUCNc">')
tbl_end = html.index('</table>', tbl_start) + len('</table>')
rows_html = ''.join(
    '<tr><td><b>%s</b> %s</td><td>%s</td><td>%d</td></tr>'
    % (DIM_SHORT[d], dim_name(d), DIM_SCOPE[d], dim_cnt.get(d, 0)) for d in DIMS)
new_tbl = ('<table data-page-node-id="ypXG9dz1aMR48PrHtHUCNc">'
           '<tr><th>维度</th><th>范围</th><th>条数</th></tr>' + rows_html + '</table>')
html = html[:tbl_start] + new_tbl + html[tbl_end:]
notes.append('OK[维度分布表] 重建 %d 行' % len(DIMS))

# ---- 条形图(重建 <div class="bars"> 块) ----
max_n = max(dim_cnt.values()) or 1
bar_start = html.index('<div class="bars"')
bar_end = html.index('\n        </div>', bar_start) + len('\n        </div>')
bar_rows = []
for d in DIMS:
    n = dim_cnt.get(d, 0)
    w = int(round(n / max_n * 100))
    fill = 'style="background:var(--p0);width:%d%%"' % w if d == 'D4安全' else 'style="width:%d%%"' % w
    bar_rows.append('<div class="bar-row"><span>%s %s</span>'
                    '<div class="track"><div class="fill" %s></div></div>'
                    '<span class="n">%d</span></div>' % (DIM_SHORT[d], dim_name(d), fill, n))
new_bars = '<div class="bars">\n          ' + '\n          '.join(bar_rows) + '\n        </div>'
html = html[:bar_start] + new_bars + html[bar_end:]
notes.append('OK[条形图] 重建 %d 行' % len(DIMS))

# ---- 用例库表格规模 ----
rep('<b data-page-node-id="2wxGNiatHJ1jx7LpGtF382">123</b>',
    '<b data-page-node-id="2wxGNiatHJ1jx7LpGtF382">%d</b>' % n_design, '母版设计级规模')
rep('<b data-page-node-id="25Gsf1OEjwuAeM3Ts7RGvT">107</b>',
    '<b data-page-node-id="25Gsf1OEjwuAeM3Ts7RGvT">%d</b>' % n_expanded, '母版展开级规模')
rep('客户端矩阵 70 / 服务矩阵 22 / 评测任务集 15',
    'D5 客户端矩阵 70 / D3-C4 服务矩阵 22 / D10 评测集 15 / NR3 终端矩阵 25 / D1-58 白名单 5', '展开级描述')
rep('已同步 123 条（ITER-002 修复漂移', '已同步 %d 条（仓库母版回流' % n_design, 'note 设计级同步数')
rep('展开级 107 条 = 三种枚举矩阵', '展开级 %d 条 = 五种枚举矩阵' % n_expanded, '展开级 h4')

# ---- 执行状态总览(重建 case-status-tbl) ----
tbl_start = html.index('<table data-page-node-id="case-status-tbl">')
tbl_end = html.index('</table>', tbl_start) + len('</table>')
status_rows = []
for d in DIMS:
    c = status_dim[d]
    status_rows.append('<tr><td>%s %s</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td><td></td></tr>'
                       % (DIM_SHORT[d], dim_name(d), dim_cnt.get(d, 0),
                          c.get('通过', 0), c.get('缺陷观察', 0), c.get('环境缺口', 0), c.get('待执行', 0)))
t = status_total
status_rows.append('<tr><td><b>合计</b></td><td><b>%d</b></td><td><b>%d</b></td><td><b>%d</b></td>'
                   '<td><b>%d</b></td><td><b>%d</b></td><td>已评估 138 + 待执行 %d（仓库母版回流）</td></tr>'
                   % (n_design, t.get('通过', 0), t.get('缺陷观察', 0), t.get('环境缺口', 0),
                      t.get('待执行', 0), t.get('待执行', 0)))
new_status_tbl = ('<table data-page-node-id="case-status-tbl">'
                  '<tr><th>维度</th><th>总用例</th><th>✅ 通过</th><th>⚠️ 缺陷观察</th><th>🧩 环境缺口</th><th>⏳ 待执行</th><th>测试结果要点</th></tr>'
                  + ''.join(status_rows) + '</table>')
html = html[:tbl_start] + new_status_tbl + html[tbl_end:]
notes.append('OK[执行状态表] 重建')

rep('三·B、用例执行状态总览（138 条全量标注） <span class="tag">✅ 129 通过 · ⚠️ 8 缺陷观察 · 🧩 1 环境缺口</span>',
    '三·B、用例执行状态总览（205 条：138 已评估 + 67 待执行） <span class="tag">✅ 129 通过 · ⚠️ 8 缺陷观察 · 🧩 1 环境缺口 · ⏳ 67 待执行</span>', '执行状态 h2')
rep('逐条「执行状态 + 测试结果」见 xlsx「测试矩阵-设计级」M/N 列（138 条）与「测试矩阵-展开级」H/I 列（107 条，随源用例映射）。此处为汇总口径：',
    '逐条「执行状态 + 测试结果」见 xlsx「测试矩阵-设计级」M/N 列（%d 条）与「测试矩阵-展开级」H/I 列（%d 条，随源用例映射）。新增用例标注「待执行」。此处为汇总口径：' % (n_design, n_expanded), '执行状态 muted')

# ---- 成熟度 ----
rep('设计级 138 + 展开级 107（CSV 真源）+ 生成 / 校验脚本',
    '设计级 %d + 展开级 %d（CSV 真源）+ 生成 / 校验脚本' % (n_design, n_expanded), '成熟度规模')
rep('已同步 138 条（ITER-004 修复漂移，check_docs 0 问题）',
    '已同步 %d 条（仓库母版回流，check_docs 0 问题）' % n_design, '成熟度 README')

# ---- 执行覆盖率口径 ----
rep('② 执行覆盖评估完成：设计级 138/138（100%）= ITER-003 123/123 + NR3 新增 15/15 执行留痕',
    '② 执行覆盖：设计级 138/%d 已评估（新增 67 待执行）' % n_design, '缺口②标题')
rep('设计级 123/123 评估完成（ITER-003 收口，口径：审计留痕73+8批补测49+缺口清零）+ ITER-004 NR3 新增 15/15 全执行留痕 = 138/138；口径修正轨迹：73% 虚高（含批量）→ 61.8% → 69.1% → 100%。metrics/execution.csv 原子执行记录设计与设计级相关批次累计吻合（另 T1 单测/冒烟/探针为验证性批量不计设计级）。缺陷：#561-565 已补齐（OBS-12/13/14/15 + 孤儿规则）；#554 未修复（P0，Windows 更新检测）。',
    '设计级 138/%d 已评估（通过 129 + 缺陷观察 8 + 环境缺口 1）；新增 67 条为仓库母版 2026-09-19 回流后待补测（D1 更新检测细分 30 / D3 功能维度 16 / D2 认证 7 / D4 安全 6 / 其余 8）。metrics 原子执行记录口径不变。缺陷：#561-565 已补齐；#554 未修复（P0，Windows 更新检测）。' % n_design, '缺口②正文')
rep('<span class="warn" data-page-node-id="9Bx9uw17swd2O27sOVMCdJ">达成</span>（设计级评估完成 100%=138/138；NR3 15/15；ITER-003 D10-6 交付）',
    '<span class="warn" data-page-node-id="9Bx9uw17swd2O27sOVMCdJ">进行中</span>（定义 %d 条完整；已评估 138/%d，新增 67 待执行）' % (n_design, n_design), '退出标准执行覆盖率')

# ---- footer ----
rep('main @ 9d22f39，2026-09-10 同步 · ITER-004 收尾',
    'main @ e09ab4e1，2026-09-21 同步 · 仓库母版回流（设计级 %d / 展开级 %d）' % (n_design, n_expanded), 'footer')

io.open(HTML, 'w', encoding='utf-8').write(html)
print('=== 替换报告 ===')
for n in notes:
    print(' ', n)

# ---- 校验 ----
h = io.open(HTML, 'r', encoding='utf-8').read()
checks = [
    ('342' in h, '含 342'),
    ('设计级 205' in h, '含 设计级 205'),
    ('展开级 137' in h, '含 展开级 137'),
    ('P0 19 / P1 109 / P2 77' in h, '优先级 19/109/77'),
    ('138/205' in h and '67 待执行' in h, '执行口径 138/205 + 67待执行'),
    ('未找到' not in ''.join(notes), '无未命中的替换'),
]
print('\n=== 校验 ===')
allok = True
for ok, m in checks:
    print(('PASS' if ok else 'FAIL'), '-', m)
    allok = allok and ok
print('\nRESULT:', 'PASS' if allok else 'FAIL')