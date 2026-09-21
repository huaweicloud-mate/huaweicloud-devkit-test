# -*- coding: utf-8 -*-
"""
pull_merge.py - 飞书 wiki 手工更新 → 合并回本地 test manage 工作源（一键）

流程:
  1) sync_sheet.py --pull        : 线上 14 sheet 全量拉到 mirror 临时文件
  2) 合并 mirror -> 工作源 xlsx  :
     - 矩阵型(MATRIX) : 线上行按主键 upsert 回本地对应 sheet
       （线上手工改动的行/新增的行 → 覆盖/追加；本地多出但线上没有的行保留；
        冲突以线上为准 = 用户 wiki 手工内容是最近意图）
     - 快照型/其他      : 在线 sheet 存在且工作源有同名 sheet 时，仅当线上该行非空
       且有内容差异才覆盖（保守：快照型以本地为准，手动表直接并入）
     - 工作源没有的 sheet（如 测试机资源/版本计划管理 手工表）→ 整表并入
  3) 输出差异报告 + 备份 .bak-pull

用法: python pull_merge.py [--out 工作源xlsx] [--dry-run]
默认工作源: C:\\Users\\Administrator\\devkit-test\\test manage\\huaweicloud-devkit-测试全景图.xlsx
"""
import argparse, json, os, shutil, subprocess, sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_WORK = r'C:\Users\Administrator\devkit-test\test manage\huaweicloud-devkit-测试全景图.xlsx'
DEFAULT_MIRROR = os.path.join(HERE, 'mirror', 'pull-mirror.xlsx')
MATRIX = {"测试矩阵-设计级": "ID", "测试矩阵-展开级": "ID",
          "缺陷清单": "ID", "验收标准": "门禁项", "执行计划": "阶段"}
HANDMADE = {"测试机资源", "版本计划管理"}
PY = r'C:\Users\Administrator\devkit-test\.venv-feishu\Scripts\python.exe'


def run(args):
    # 1) pull 到 mirror
    if os.path.exists(DEFAULT_MIRROR):
        os.remove(DEFAULT_MIRROR)
    r = subprocess.run([PY, os.path.join(HERE, 'sync_sheet.py'), '--pull', DEFAULT_MIRROR],
                       capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=600)
    print(r.stdout)
    if r.returncode != 0:
        print('[pull 失败]', r.stderr[-600:])
        sys.exit(1)

    import openpyxl
    from openpyxl.utils import get_column_letter

    work = args.out
    wb = openpyxl.load_workbook(work)
    mb = openpyxl.load_workbook(DEFAULT_MIRROR)
    report = []

    def find_pk_row(ws, pk):
        """返回 (表头行号1基, 主键列号), 前 5 行内找"""
        for r in range(1, min(6, ws.max_row + 1)):
            for c in range(1, ws.max_column + 1):
                if str(ws.cell(row=r, column=c).value or '').strip() == pk:
                    return r, c
        return None

    added, updated, same = [], [], []
    for mtitle in mb.sheetnames:
        mws = mb[mtitle]
        mrows = [[mws.cell(row=r, column=c).value for c in range(1, mws.max_column + 1)]
                 for r in range(1, mws.max_row + 1)]
        # 去尾部空行
        while mrows and not any(v is not None and str(v).strip() for v in mrows[-1]):
            mrows.pop()
        if not mrows:
            continue

        if mtitle not in wb.sheetnames:
            # 工作源没有 -> 整表并入（手工表等）
            ws = wb.create_sheet(mtitle)
            for i, row in enumerate(mrows, 1):
                for j, v in enumerate(row, 1):
                    ws.cell(row=i, column=j, value=v)
            added.append((mtitle, len(mrows)))
            report.append(f'新增 sheet «{mtitle}» {len(mrows)} 行（工作源原本不存在）')
            continue

        ws = wb[mtitle]
        pk = MATRIX.get(mtitle)
        if not pk:
            # 快照型：以线上为准整表覆盖（值层面）
            odiff = 0
            for i, row in enumerate(mrows, 1):
                for j, v in enumerate(row, 1):
                    old = ws.cell(row=i, column=j).value
                    nv = str(v) if v is not None else ''
                    ov = str(old) if old is not None else ''
                    if ov != nv:
                        odiff += 1
                        ws.cell(row=i, column=j, value=v)
            report.append(f'快照 «{mtitle}» 线上{len(mrows)}行 覆盖（差异单元格 {odiff}）')
            continue

        # 矩阵型 upsert
        loc = find_pk_row(ws, pk)
        if not loc:
            report.append(f'[warn] 本地 «{mtitle}» 找不到主键 {pk}，跳过')
            continue
        hrow, pkcol = loc
        lmap = {}
        for r in range(hrow + 1, ws.max_row + 1):
            k = ws.cell(row=r, column=pkcol).value
            if k is not None and str(k).strip():
                lmap[str(k).strip()] = r
        mhrow, mpkcol = find_pk_row(mws, pk) or (1, 1)
        umap = {}
        for r in range(mhrow + 1, mws.max_row + 1):
            k = mws.cell(row=r, column=mpkcol).value
            if k is not None and str(k).strip() and not str(k).strip().startswith('合计'):
                umap[str(k).strip()] = r
        lmap = {k: r for k, r in lmap.items() if k.strip() and not k.strip().startswith('合计')}
        n_add, n_upd, n_same = 0, 0, 0
        for k, mr in umap.items():
            mvals = [str(mws.cell(row=mr, column=c).value or '') for c in range(1, ws.max_column + 1)]
            if k in lmap:
                lr = lmap[k]
                lvals = [str(ws.cell(row=lr, column=c).value or '') for c in range(1, ws.max_column + 1)]
                if lvals != mvals:
                    for c, v in enumerate(mvals, 1):
                        ws.cell(row=lr, column=c, value=v)
                    n_upd += 1
                    updated.append((mtitle, k))
            else:
                newrow = ws.max_row + 1
                for c, v in enumerate(mvals, 1):
                    ws.cell(row=newrow, column=c, value=v)
                n_add += 1
                added.append((mtitle, k))
            n_same += 1
        report.append(f'矩阵 «{mtitle}» 线上{len(umap)}条: 新增 {n_add} / 更新 {n_upd} / 无变化 {n_same - n_add - n_upd}')

    # 备份 + 保存
    if not args.dry_run:
        bak = work + '.bak-pull-' + datetime.now().strftime('%Y%m%d%H%M')
        shutil.copy2(work, bak)
        wb.save(work)
        print(f'\n✅ 已合并并保存（备份 {os.path.basename(bak)}）')
    else:
        print('\n(dry-run 模式，未写回工作源)')

    print('\n=== pull→merge 报告 ===')
    for line in report:
        print(' ', line)
    if updated:
        print(f'\n⚠️ 线上手工更新 {len(updated)} 条已同步回本地: {updated[:10]}{"..." if len(updated) > 10 else ""}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=DEFAULT_WORK)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    run(args)