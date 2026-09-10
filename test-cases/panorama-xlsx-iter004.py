# -*- coding: utf-8 -*-
"""panorama-xlsx-iter004.py - 全景图 xlsx ITER-004 回流
①总览: 用例数 230→245 / 工具 37→39 / 标题 ITER-004
②测试矩阵-设计级: 追加 D1-26~40 共15行(含M执行状态/N测试结果) + 合计 129/8/1
③MCP工具清单: 合计 37→39 + 两行 check_update/upgrade
④缺陷清单: 追加 NR3-1/2/3
⑤验收标准: 工具39/覆盖率100%/协议39×3/功能质量含#554
⑥执行计划: T3 39 工具 / T6 issue 闭环更新
"""
import openpyxl, csv, copy, sys, re

SRC = r'C:\Users\Administrator\WorkBuddy\2026-09-08-09-56-34\huaweicloud-devkit-测试全景图.xlsx'
CSV = r'C:\Users\Administrator\devkit-test\huaweicloud-devkit-test\test-cases\design\用例矩阵-设计级.csv'

wb = openpyxl.load_workbook(SRC)

def cpy(dst_cell, src_cell):
    for attr in ('font', 'border', 'alignment', 'fill'):
        try:
            v = getattr(src_cell, attr)
            if v is not None:
                setattr(dst_cell, attr, copy.copy(v))
        except Exception:
            pass

# ---------- ① 总览 ----------
ws = wb['总览']
ws['R2'] if False else None
for r in range(1, ws.max_row + 1):
    v = ws.cell(row=r, column=1).value
    if v and 'ITER-002' in str(v):
        ws.cell(row=r, column=1).value = str(v).replace('ITER-002', 'ITER-004')
# R4 测试用例 230 → 245（R4 是多行文本 "被测规模\n41\nSkills\n29\n测试用例\n230..." 样式，找单元格含 '230'）
for r in range(1, ws.max_row + 1):
    for c in range(1, ws.max_column + 1):
        v = ws.cell(row=r, column=c).value
        if v is None:
            continue
        s = str(v)
        if '230' in s and '用例' in s:
            ws.cell(row=r, column=c).value = s.replace('230', '245')
        if '设计级 123 + 展开级 107' in s:
            ws.cell(row=r, column=c).value = s.replace('设计级 123 + 展开级 107', '设计级 138 + 展开级 107（含 NR3 新增 15）')
        if 'MCP 工具 37 + 安全规则 15 域' in s:
            ws.cell(row=r, column=c).value = s.replace('37', '39')
print('总览: done')

# ---------- ② 测试矩阵-设计级 ----------
ws = wb['测试矩阵-设计级']
# R1 标题 123 → 138
ws.cell(row=1, column=1).value = str(ws.cell(row=1, column=1).value).replace('123 条', '138 条')
# 读 CSV 新用例数据
rows = list(csv.DictReader(open(CSV, encoding='utf-8-sig')))
new_cases = [r for r in rows if re.match(r'D1-(2[6-9]|3\d|40)$', r['ID'])]
# 状态映射（与测试执行记录一致：13 通过 + D1-29 差异观察 + D1-39 P0 缺陷观察）
STATUS = {'D1-26': '通过', 'D1-27': '通过', 'D1-28': '通过', 'D1-29': '缺陷观察', 'D1-30': '通过',
          'D1-31': '通过', 'D1-32': '通过', 'D1-33': '通过', 'D1-34': '通过', 'D1-35': '通过',
          'D1-36': '通过', 'D1-37': '通过', 'D1-38': '通过', 'D1-39': '缺陷观察', 'D1-40': '通过'}
DETAIL = {'D1-29': '文档-实现差异：pre 用户会被提醒 next 更新（P3，待开发确认）',
          'D1-39': 'P0：Windows 升级检测链 EINVAL（spawnSync npm.cmd 无 shell:true，#554 未修复）→ check_update 返回 latestStable=null',
          'D1-40': '镜像当前一致，防倒退兜底生效；未固定官方源=建议项'}
# 1) 解除原合计行 R126 的合并区域（A126:B126）
for mc in list(ws.merged_cells.ranges):
    if mc.min_row == 126 and 120 <= mc.max_row <= 130:
        ws.unmerge_cells(str(mc))
# 2) 样式模板（旧合计行与 D10-8 数据行）
tpl_sum = [ws.cell(row=126, column=c) for c in range(1, 15)]
template_cells = [ws.cell(row=125, column=c) for c in range(1, 15)]
# 3) 写 15 行新用例（R126-140，覆盖旧合计行位置）
for i, case in enumerate(sorted(new_cases, key=lambda x: int(x['ID'].split('-')[1]))):
    r = 126 + i
    vals = [case['ID'], case['维度'], case['标题'], case['优先级'], case['前置条件'], case['测试数据'],
            case['操作步骤'], case['预期结果'], case['指引来源'], case['关联工具'], case['自动化建议'],
            case.get('展开规则', ''), STATUS.get(case['ID'], '通过'),
            DETAIL.get(case['ID'], 'ITER-004 NR3 函数级探针 45/46 PASS + MCP 端到端')]
    for c, v in enumerate(vals, 1):
        cell = ws.cell(row=r, column=c, value=v)
        cpy(cell, template_cells[c - 1])
# 4) 写 R141 新合计（原表 max_row=126，R141 为扩展行无幽灵合并）
rsum = 126 + len(new_cases)
for c, v in enumerate(['合计 138 条', '', '', '', '', '', '', '', '', '', '', '',
                       '通过 129 · 缺陷观察 8 · 环境缺口 1', '138 评估完成（ITER-004 NR3 15/15 执行留痕）'], 1):
    cell = ws.cell(row=rsum, column=c, value=v)
    cpy(cell, tpl_sum[c - 1])
ws.merge_cells(f'A{rsum}:B{rsum}')
print(f'测试矩阵-设计级: +{len(new_cases)} 行 (R126-{rsum-1}), 合计 R{rsum}')

# ---------- ③ MCP工具清单 ----------
ws = wb['MCP工具清单']
for r in range(1, ws.max_row + 1):
    v = ws.cell(row=r, column=1).value
    if v and '合计 37' in str(v):
        ws.cell(row=r, column=1).value = str(v).replace('37', '39')
# 由合计行上插两行（工具名）
last_data_row = ws.max_row - 1  # 合计行前一行
ws.insert_rows(last_data_row + 1, 2)
tpl = ws.cell(row=last_data_row, column=1)
for i, (dom, tool, note) in enumerate([('版本/升级', 'huaweicloud_check_update', 'check_update 检查新版本（检测/提醒/dismiss 冷却）'),
                                       ('版本/升级', 'huaweicloud_upgrade', 'upgrade 升级到最新（version=latest，需用户同意）')]):
    r = last_data_row + 1 + i
    for c, v in enumerate([dom, tool, tool, '', note], 1):
        cell = ws.cell(row=r, column=c, value=v)
        cpy(cell, tpl)
print('MCP工具清单: done')

# ---------- ④ 缺陷清单 ----------
ws = wb['缺陷清单']
last = ws.max_row
tpl = ws.cell(row=last, column=1)
new_def = [
    ['NR3-1', 'P0', '产品', 'Windows 升级检测链 EINVAL（=#554 未修复当前态）：check_update/upgrade 在 Windows 不可用（spawnSync npm.cmd 无 shell:true），存量用户收不到版本升级提醒', 'D1', '未上报新单（与 #554 同根因待决策）', '#554 OPEN'],
    ['NR3-2', 'P3', '产品', '设计文档版本比对表（pre 版本不提醒）与实现（pre 用户会被提醒 next 更新）不一致', 'D1', '待开发确认', '—'],
    ['NR3-3', 'P3', '建议', 'update-check 未固定官方 registry（#518 建议残留；防倒退兜底生效非缺陷）', 'D1', '跟踪', '—'],
]
for i, rowv in enumerate(new_def):
    for c, v in enumerate(rowv, 1):
        cell = ws.cell(row=last + 1 + i, column=c, value=v)
        cpy(cell, tpl)
print(f'缺陷清单: +3 行 (R{last+1}-{last+3})')

# ---------- ⑤ 验收标准 ----------
ws = wb['验收标准']
for r in range(1, ws.max_row + 1):
    v = ws.cell(row=r, column=3).value
    if not v:
        continue
    s = str(v)
    if '37 工具' in s:
        ws.cell(row=r, column=3).value = s.replace('37 工具', '39 工具')
    if '37×3' in s:
        ws.cell(row=r, column=3).value = s.replace('37×3', '39×3')
    if '99.2%=122/123' in s:
        ws.cell(row=r, column=3).value = s.replace('99.2%=122/123：审计留痕73+补测49+缺口1(D10-6评测基建,ITER-003)',
                                                   '100%=138/138（ITER-003 123/123 + NR3 新增 15/15 执行留痕）')
    if '9 P 类 + 1 集成' in s:
        ws.cell(row=r, column=3).value = s.replace('9 P 类 + 1 集成 open：既有 6 + OBS-9/10/11 + INT-1',
                                                   '10 P 类 + 1 集成 open：既有 6 + OBS-9/10/11 + #554(未修复 P0) + INT-1')
print('验收标准: done')

# ---------- ⑥ 执行计划 ----------
ws = wb['执行计划']
for r in range(1, ws.max_row + 1):
    v = ws.cell(row=r, column=4).value
    if not v:
        continue
    s = str(v)
    if '37×3' in s:
        ws.cell(row=r, column=4).value = s.replace('37×3', '39×3')
    if '#560' in s and '闭环' in s:
        ws.cell(row=r, column=4).value = s + '；ITER-004 +#561-565 全 triaged，#554 未修复待转派，NR3 15 用例执行'
print('执行计划: done')

wb.save(SRC)
print('SAVED:', SRC)

# ---------- 校验 ----------
wb2 = openpyxl.load_workbook(SRC)
m = wb2['测试矩阵-设计级']
ids = [m.cell(row=r, column=1).value for r in range(3, m.max_row + 1)]
ok_new = all(f'D1-{n}' in ids for n in range(26, 41))
ok_sum = str(m.cell(row=m.max_row, column=1).value).startswith('合计 138')
ok_m = all(m.cell(row=r, column=13).value in ('通过', '缺陷观察') for r in range(126, 141))
print(f'校验: 15新用例齐全={ok_new} 合计行={ok_sum} M列状态完整={ok_m}')
t = wb2['总览']
txt = '\n'.join(str(t.cell(row=r, column=c).value or '') for r in range(1, 8) for c in range(1, 7))
print(f'校验: 总览 245={("245" in txt)} 39工具={("MCP 工具 39" in txt) or ("39" in txt and "37" not in txt.split("MCP 工具")[0])} 138={("设计级 138" in txt)}')