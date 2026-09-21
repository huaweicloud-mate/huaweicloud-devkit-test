# -*- coding: utf-8 -*-
"""sync_panorama_matrix.py - 从仓库母版 CSV 回流全景图 xlsx 矩阵（upsert by ID）

真源: huaweicloud-devkit-test/test-cases/design/用例矩阵-设计级.csv (27列) + expanded/用例矩阵-展开级.csv (24列)
目标: test manage/huaweicloud-devkit-测试全景图.xlsx 的「测试矩阵-设计级」「测试矩阵-展开级」sheet

映射:
  设计级: CSV 前12列(ID..展开规则) -> xlsx 前12列; xlsx 第13/14列=执行状态/测试结果(全景图特有,保留)
  展开级: CSV 前7列(ID..预期结果) -> xlsx 前7列; xlsx 第8/9列=执行状态/测试结果(全景图特有,保留)

策略:
  已存在 ID -> 母版覆盖前12/7列,保留执行状态/测试结果两列
  新增 ID   -> 追加行(复制样式),执行状态='待执行',测试结果='仓库母版回流(待执行)'
  母版已删 ID -> 检测到则打印 warning(不自动删,避免行错位)

联动: 总览指标卡(测试用例数/设计级+展开级)、验收标准 R6 执行覆盖口径。
出口自校验: 重开 xlsx,断言设计级/展开级 ID 全集 == 母版 ID 全集,否则 exit!=0。
"""
import csv
import io
import os
import shutil
import sys
from collections import Counter
from datetime import datetime
from copy import copy

import openpyxl

BASE = r'C:\Users\Administrator\devkit-test\huaweicloud-devkit-test\test-cases'
X = r'C:\Users\Administrator\devkit-test\test manage\huaweicloud-devkit-测试全景图.xlsx'

DESIGN_COLS = ['ID', '维度', '标题', '优先级', '前置条件', '测试数据', '操作步骤',
               '预期结果', '指引来源', '关联工具', '自动化建议', '展开规则']
EXPAND_COLS = ['ID', '展开类型', '枚举对象', '源用例', '优先级', '执行要点', '预期结果']

DESIGN_SHEET = '测试矩阵-设计级'
EXPAND_SHEET = '测试矩阵-展开级'


def read_csv(path):
    with io.open(path, 'r', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def cpy(dst_cell, src_cell):
    """复制样式(字体/边框/对齐/填充),不复制值。"""
    if src_cell is None:
        return
    for attr in ('font', 'border', 'alignment', 'fill'):
        try:
            v = getattr(src_cell, attr)
            if v is not None:
                setattr(dst_cell, attr, copy(v))
        except Exception:
            pass


def find_sum_row(ws):
    """返回合计行号(第一列值 startswith '合计'),找不到返回 None。"""
    for r in range(1, ws.max_row + 1):
        v = ws.cell(row=r, column=1).value
        if v is not None and str(v).startswith('合计'):
            return r
    return None


def unmerge(ws, row, col_start, col_end):
    for mc in list(ws.merged_cells.ranges):
        if mc.min_row == row and mc.max_row == row:
            ws.unmerge_cells(str(mc))


def upsert(ws, hdr_row, records, cols, status_col, result_col, extra_pairs, new_status, new_result):
    """records: list[dict] (母版顺序)。返回 (新增数, 更新数)。"""
    # 现有 ID -> 行
    id_row = {}
    sum_row = find_sum_row(ws)
    data_end = (sum_row - 1) if sum_row else ws.max_row
    for r in range(hdr_row + 1, data_end + 1):
        v = ws.cell(row=r, column=1).value
        if v is not None and str(v).strip():
            id_row[str(v).strip()] = r

    n_add = n_upd = 0
    # 数据行样式模板(取合计行前一行)
    tpl_row = data_end
    # 合计行样式模板
    sum_row_eff = sum_row if sum_row else data_end + 1

    # 先更新已存在 ID(原位覆盖前若干列,保留状态/结果列)
    new_ids_in_order = []
    for rec in records:
        iid = rec['ID'].strip()
        if iid in id_row:
            r = id_row[iid]
            for ci, col in enumerate(cols, 1):
                ws.cell(row=r, column=ci, value=(rec[col] if rec[col] is not None else ''))
            n_upd += 1
        else:
            new_ids_in_order.append(rec)

    # 追加新行: 写在旧合计行位置,合计行下移
    if sum_row:
        unmerge(ws, sum_row, 1, 2)
    write_r = sum_row if sum_row else data_end + 1
    for rec in new_ids_in_order:
        r = write_r
        for ci, col in enumerate(cols, 1):
            cell = ws.cell(row=r, column=ci, value=(rec[col] if rec[col] is not None else ''))
            cpy(cell, ws.cell(row=tpl_row, column=ci))
        scell = ws.cell(row=r, column=status_col, value=new_status)
        cpy(scell, ws.cell(row=tpl_row, column=status_col))
        rcell = ws.cell(row=r, column=result_col, value=new_result)
        cpy(rcell, ws.cell(row=tpl_row, column=result_col))
        n_add += 1
        write_r += 1

    # 新合计行
    new_sum = write_r
    for ci in range(1, extra_pairs['max_col'] + 1):
        cpy(ws.cell(row=new_sum, column=ci), ws.cell(row=sum_row_eff, column=ci))

    # 母版已删 ID(本轮检测)
    removed = set(id_row) - set(rec['ID'].strip() for rec in records)
    if removed:
        print('[warn] %s 母版已删(未自动清理): %s' % (ws.title, sorted(removed)))

    return n_add, n_upd, new_sum


def recount_status(ws, hdr_row, data_end, status_col):
    """统计执行状态列取值分布。"""
    cnt = Counter()
    for r in range(hdr_row + 1, data_end + 1):
        v = ws.cell(row=r, column=status_col).value
        s = str(v).strip() if v is not None else ''
        if s:
            cnt[s] += 1
    return cnt


def main():
    design = read_csv(os.path.join(BASE, 'design', '用例矩阵-设计级.csv'))
    expanded = read_csv(os.path.join(BASE, 'expanded', '用例矩阵-展开级.csv'))
    print('母版: 设计级 %d 条 / 展开级 %d 条' % (len(design), len(expanded)))

    # 备份
    bak = X + '.bak-sync-' + datetime.now().strftime('%Y%m%d%H%M%S')
    shutil.copy2(X, bak)
    print('备份:', os.path.basename(bak))

    wb = openpyxl.load_workbook(X)

    # ===== 设计级 =====
    ws = wb[DESIGN_SHEET]
    # 更新标题 R1 计数
    t = ws.cell(row=1, column=1).value
    ws.cell(row=1, column=1, value=str(t).replace('设计级用例（138 条', '设计级用例（%d 条' % len(design)))
    n_add, n_upd, new_sum = upsert(
        ws, hdr_row=2, records=design, cols=DESIGN_COLS,
        status_col=13, result_col=14,
        extra_pairs={'max_col': 14}, new_status='待执行',
        new_result='仓库母版回流（待执行）')
    # 新合计行内容
    data_end = new_sum - 1
    cnt = recount_status(ws, 2, data_end, 13)
    ws.cell(row=new_sum, column=1, value='合计 %d 条' % len(design))
    ws.cell(row=new_sum, column=13,
            value='通过 %d · 缺陷观察 %d · 环境缺口 %d · 待执行 %d' % (
                cnt.get('通过', 0), cnt.get('缺陷观察', 0), cnt.get('环境缺口', 0), cnt.get('待执行', 0)))
    ws.cell(row=new_sum, column=14,
            value='%d 定义（仓库母版回流：%d 已评估 + %d 待执行）' % (len(design), len(design) - n_add, n_add))
    ws.merge_cells('A%d:B%d' % (new_sum, new_sum))
    print('设计级: 新增 %d / 更新 %d / 合计行 R%d' % (n_add, n_upd, new_sum))

    # ===== 展开级 =====
    ws = wb[EXPAND_SHEET]
    t = ws.cell(row=1, column=1).value
    # 重算展开类型分布
    typ_cnt = Counter(r['展开类型'].strip() for r in expanded if r.get('展开类型', '').strip())
    summary = ' / '.join('%s %d' % (k, v) for k, v in sorted(typ_cnt.items()))
    ws.cell(row=1, column=1, value='测试矩阵 · 展开级用例（%d 条 · %s）' % (len(expanded), summary))
    n_add2, n_upd2, new_sum2 = upsert(
        ws, hdr_row=2, records=expanded, cols=EXPAND_COLS,
        status_col=8, result_col=9,
        extra_pairs={'max_col': 9}, new_status='待执行',
        new_result='仓库母版回流（待执行）')
    data_end2 = new_sum2 - 1
    cnt2 = recount_status(ws, 2, data_end2, 8)
    ws.cell(row=new_sum2, column=1, value='合计 %d 条' % len(expanded))
    ws.cell(row=new_sum2, column=8,
            value='通过 %d · 缺陷观察 %d · 环境缺口 %d · 未映射 %d · 待执行 %d' % (
                cnt2.get('通过', 0), cnt2.get('缺陷观察', 0), cnt2.get('环境缺口', 0),
                cnt2.get('未映射', 0), cnt2.get('待执行', 0)))
    ws.merge_cells('A%d:B%d' % (new_sum2, new_sum2))
    print('展开级: 新增 %d / 更新 %d / 合计行 R%d' % (n_add2, n_upd2, new_sum2))

    # ===== 总览联动 =====
    ws = wb['总览']
    total = len(design) + len(expanded)
    for r in range(1, ws.max_row + 1):
        for c in range(1, ws.max_column + 1):
            v = ws.cell(row=r, column=c).value
            if v is None:
                continue
            s = str(v)
            # 指标卡: 测试用例 245 -> 342
            if '测试用例' in s and '245' in s:
                ws.cell(row=r, column=c, value=s.replace('245', str(total)))
            # R6 设计级+展开级
            if '设计级 138 + 展开级 107' in s:
                ws.cell(row=r, column=c, value=s.replace(
                    '设计级 138 + 展开级 107（含 NR3 新增 15）（执行 ≈73%+ / 90+ 条）',
                    '设计级 %d + 展开级 %d（仓库母版回流，新增待执行）' % (len(design), len(expanded))))
            # 标题版本标记
            if 'ITER-004-2026-09-08 收尾更新' in s:
                ws.cell(row=r, column=c, value=s.replace(
                    'ITER-004-2026-09-08 收尾更新',
                    '仓库母版回流 %s（设计级 %d / 展开级 %d）' % (
                        datetime.now().strftime('%Y-%m-%d'), len(design), len(expanded))))
    print('总览: 测试用例 %d (设计级 %d + 展开级 %d)' % (total, len(design), len(expanded)))

    # ===== 验收标准 R6 执行覆盖口径 =====
    ws = wb['验收标准']
    for r in range(1, ws.max_row + 1):
        v = ws.cell(row=r, column=3).value
        if v and '设计级评估完成' in str(v):
            ws.cell(row=r, column=3, value='设计级 %d 定义；已执行评估 138/%d，新增 %d 待执行（仓库母版 2026-09-19 回流）' % (
                len(design), len(design), n_add))
    print('验收标准 R6: 执行覆盖口径已更新')

    wb.save(X)
    print('SAVED:', X)

    # ===== 出口自校验 =====
    wb2 = openpyxl.load_workbook(X, read_only=True, data_only=True)
    def sheet_ids(sheet):
        ws = wb2[sheet]
        ids = []
        for row in ws.iter_rows(values_only=True):
            v = row[0]
            if v is None:
                continue
            s = str(v).strip()
            if s and not s.startswith(('ID', '合计', '测试矩阵')) and '条' not in s:
                ids.append(s)
        return ids
    ok_d = set(sheet_ids(DESIGN_SHEET)) == set(r['ID'].strip() for r in design)
    ok_e = set(sheet_ids(EXPAND_SHEET)) == set(r['ID'].strip() for r in expanded)
    wb2.close()
    print('\n=== 出口自校验 ===')
    print('设计级 ID 全集 == 母版: %s (母版 %d)' % (ok_d, len(design)))
    print('展开级 ID 全集 == 母版: %s (母版 %d)' % (ok_e, len(expanded)))
    if not (ok_d and ok_e):
        print('校验失败, exit 1')
        sys.exit(1)
    print('OK')


if __name__ == '__main__':
    main()