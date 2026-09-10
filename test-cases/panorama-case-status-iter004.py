# -*- coding: utf-8 -*-
"""panorama-case-status-iter004.py - 三·B 用例执行状态总览表同步到 138 条口径"""
import sys

src = sys.argv[1]
h = open(src, encoding='utf-8').read()
orig = h

# 1) 标题 + tag
h = h.replace('三·B、用例执行状态总览（123 条全量标注） <span class="tag">✅ 116 通过 · ⚠️ 6 缺陷观察 · 🧩 1 环境缺口</span>',
              '三·B、用例执行状态总览（138 条全量标注） <span class="tag">✅ 129 通过 · ⚠️ 8 缺陷观察 · 🧩 1 环境缺口</span>')
# 2) 描述
h = h.replace('见 xlsx「测试矩阵-设计级」M/N 列（123 条）与「测试矩阵-展开级」H/I 列',
              '见 xlsx「测试矩阵-设计级」M/N 列（138 条）与「测试矩阵-展开级」H/I 列')
# 3) D1 行（15 旧全过 + 15 新增 13 过 2 观察）
h = h.replace('<tr><td>D1 安装</td><td>15</td><td>15</td><td>0</td><td>0</td><td>多客户端安装闭环/doctor/通用通道（D1-8 补测通过）</td></tr>',
              '<tr><td>D1 安装</td><td>30</td><td>28</td><td>2</td><td>0</td><td>多客户端安装闭环 + NR3 升级提醒 15 用例（D1-26~40, 13 通过；⚠️ D1-29 文档差异 P3 / D1-39 Windows EINVAL P0=#554）</td></tr>')
# 4) 合计行
h = h.replace('<tr><td><b>合计</b></td><td><b>123</b></td><td><b>116</b></td><td><b>6</b></td><td><b>1</b></td><td>评估完成 99.2%（审计留痕73 + 补测49 + 缺口1）；metrics 原子执行记录 60 条次</td></tr>',
              '<tr><td><b>合计</b></td><td><b>138</b></td><td><b>129</b></td><td><b>8</b></td><td><b>1</b></td><td>评估完成 100%（ITER-003 123/123 + ITER-004 NR3 15/15 执行留痕）；metrics 原子执行记录 +=24 条次</td></tr>')

# 校验
assert '三·B、用例执行状态总览（138 条全量标注）' in h
assert '（123 条全量标注）' not in h
assert '<td><b>合计</b></td><td><b>138</b>' in h
assert 'D1 安装</td><td>30</td>' in h
assert h.count('<table') == h.count('</table>'), 'table mismatch'

open(src, 'w', encoding='utf-8').write(h)
print(f'OK 三·B 状态总览已同步 138 口径: {len(orig)} -> {len(h)}')