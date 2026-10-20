# -*- coding: utf-8 -*-
"""panorama-refresh-latest.py —— 把 huaweicloud-devkit 测试全景图（HTML + xlsx）从工作源
回流到"当前真源口径"，并把快照日期/KPI/维度分布/执行状态表全部按真源重算。

真源（2026-10-20 / 仓库 huaweicloud-devkit-test）：
  - test-cases/design/用例矩阵-设计级.csv               → 设计级 212 条（D1..D10 维度列计数）
  - test-cases/expanded/用例矩阵-展开级.csv             → 展开级 137 条
  - test-cases/ux/用例矩阵-体验级.csv                   → 体验级 43 条
  - results/Summary/用例矩阵-设计级-总执行结果-<日期>.csv → 当日执行真源（107 条 × 11 机位 = 1177 单元格）
  - metrics/trend.csv                                  → 跨日趋势（最新一行：执行率 / 通过率）

工作源（被改写的对象，唯一工作目录）：
  C:\\Users\\Administrator\\devkit-test\\test manage\\huaweicloud-devkit-测试全景图.html
  C:\\Users\\Administrator\\devkit-test\\test manage\\huaweicloud-devkit-测试全景图.xlsx

策略：只做数据回流（数字 / 快照日期 / 维度分布 / 执行状态表 / 合计行），保留原有章节结构。
先备份（.bak-<YYYYMMDD>），HTML 用精确子串替换（每处断言命中次数），xlsx 用 openpyxl upsert。
不 git commit / push。脚本读写一律 UTF-8，禁止用 PowerShell Get-Content/sed 改中文 HTML。

用法：
  C:\\Users\\Administrator\\devkit-test\\.venv-feishu\\Scripts\\python.exe test-cases\\panorama-refresh-latest.py [日期 默认今天]
"""
import csv
import io
import os
import re
import shutil
import sys
from collections import Counter
from copy import copy
from datetime import datetime

import openpyxl

REPO = r'C:\Users\Administrator\devkit-test\huaweicloud-devkit-test'
WORK = r'C:\Users\Administrator\devkit-test\test manage'
HTML = os.path.join(WORK, 'huaweicloud-devkit-测试全景图.html')
XLSX = os.path.join(WORK, 'huaweicloud-devkit-测试全景图.xlsx')

DIMS = ['D1安装', 'D2认证', 'D3功能', 'D4安全', 'D5客户端',
        'D6性能', 'D7兼容', 'D8质量', 'D9协议', 'D10评测']
DIM_LABEL = {'D1安装': 'D1 安装', 'D2认证': 'D2 认证', 'D3功能': 'D3 功能', 'D4安全': 'D4 安全',
             'D5客户端': 'D5 客户端', 'D6性能': 'D6 性能', 'D7兼容': 'D7 兼容', 'D8质量': 'D8 质量',
             'D9协议': 'D9 协议', 'D10评测': 'D10 评测'}

DESIGN_COLS = ['ID', '维度', '标题', '优先级', '前置条件', '测试数据', '操作步骤',
               '预期结果', '指引来源', '关联工具', '自动化建议', '展开规则']
EXPAND_COLS = ['ID', '展开类型', '枚举对象', '源用例', '优先级', '执行要点', '预期结果']


def rd(path):
    with io.open(path, 'r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def log(*a):
    print(*a)


def cpy(dst, src):
    if src is None:
        return
    for attr in ('font', 'border', 'alignment', 'fill'):
        try:
            v = getattr(src, attr)
            if v is not None:
                setattr(dst, attr, copy(v))
        except Exception:
            pass


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime('%Y-%m-%d')
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # ---------- 真源读入 ----------
    design = rd(os.path.join(REPO, 'test-cases', 'design', '用例矩阵-设计级.csv'))
    expanded = rd(os.path.join(REPO, 'test-cases', 'expanded', '用例矩阵-展开级.csv'))
    ux = rd(os.path.join(REPO, 'test-cases', 'ux', '用例矩阵-体验级.csv'))
    nD, nE, nU = len(design), len(expanded), len(ux)
    dim_cnt = Counter(r['维度'].strip() for r in design)
    pri_cnt = Counter(r['优先级'].strip() for r in design)
    log('真源: 设计级 %d / 展开级 %d / 体验级 %d ; 维度 %s' % (nD, nE, nU, dict(dim_cnt)))
    assert nD == 212 and nE == 137 and nU == 43, '真源条数非预期(212/137/43)'
    assert sum(dim_cnt.values()) == nD

    # 当日执行真源
    exec_csv = os.path.join(REPO, 'results', 'Summary',
                            '用例矩阵-设计级-总执行结果-%s.csv' % date)
    with io.open(exec_csv, 'r', encoding='utf-8-sig', newline='') as f:
        rows = list(csv.reader(f))
    hdr, data = rows[0], rows[1:]
    mcols = [i for i, h in enumerate(hdr) if re.search(r'-(Linux|Windows)$', h)]
    assert len(mcols) == 11, '机位列数 != 11: %d' % len(mcols)
    bucket = {d: dict(day=0, allpass=0, failspec=0, blocked=0, notrun=0) for d in DIMS}
    cell = Counter()
    for r in data:
        d = r[2].strip()
        st = [r[i].strip() for i in mcols]
        for s in st:
            cell[s] += 1
        if d not in bucket:
            continue
        bucket[d]['day'] += 1
        npass = st.count('PASS')
        nfail = st.count('FAIL') + st.count('SPEC-MISMATCH')
        nblk = st.count('BLOCKED')
        nblank = sum(1 for s in st if s == '')
        nnr = st.count('NOT_RUN') + nblank
        if nfail > 0:
            bucket[d]['failspec'] += 1
        elif nblk > 0:
            bucket[d]['blocked'] += 1
        elif nnr > 0:
            bucket[d]['notrun'] += 1
        elif npass == len(st):
            bucket[d]['allpass'] += 1
    tot = {k: sum(bucket[d][k] for d in DIMS)
           for k in ('day', 'allpass', 'failspec', 'blocked', 'notrun')}
    assert tot['day'] == len(data), '当日用例数 != 数据行数'
    log('当日用例 %d 条 × %d 机位 = %d 单元格 ; 桶 %s' % (len(data), len(mcols), len(data) * len(mcols), tot))
    log('单元格口径: ' + ' '.join('%s=%d' % (k or '(空)', v) for k, v in sorted(cell.items())))

    # trend.csv 最新一行
    trend = None
    with io.open(os.path.join(REPO, 'metrics', 'trend.csv'), 'r', encoding='utf-8-sig', newline='') as f:
        for row in csv.DictReader(f):
            if row['date'] == date:
                trend = row
    assert trend, 'trend.csv 无 %s 行' % date
    exec_rate, pass_rate = trend['exec_rate'], trend['pass_rate']
    log('trend.csv %s: 执行率 %s / 通过率 %s' % (date, exec_rate, pass_rate))

    # ---------- 备份 ----------
    for pth in (HTML, XLSX):
        bak = pth + '.bak-' + date.replace('-', '')
        if not os.path.exists(bak):
            shutil.copy2(pth, bak)
            log('备份:', os.path.basename(bak))

    # ---------- HTML 数据回流 ----------
    with io.open(HTML, 'r', encoding='utf-8', newline='') as f:
        html = f.read()

    reps = []           # (old, new)

    # 头部
    reps.append((
        '数据快照 2026-09-21（仓库母版回流：设计级 205 + 展开级 137）',
        '数据快照 %s（每日流水线口径：设计级 %d + 展开级 %d + 体验级 %d）' % (date, nD, nE, nU)))
    reps.append(('基线 dev @ 74b9642（1.1.1-next.16）vs main @ bcefb32',
                 '被测版本 v1.1.10-next.0（%s 专项分析真源）' % date))
    reps.append(('ITER-001+002：设计级 122/123 评估完成（99.2%）✅ · 口径：审计提及73+补测49+缺口1 · metrics 原子记录60',
                 '当日（%s）：%d 条 × %d 机位 = %d 单元格 · 执行率 %s%% / 通过率 %s%%（metrics/trend.csv）'
                 % (date, tot['day'], len(mcols), tot['day'] * len(mcols), exec_rate, pass_rate)))
    reps.append(('用例 342 = 设计级 205 + 展开级 137',
                 '用例 349 = 设计级 %d + 展开级 %d（另体验级 %d）' % (nD, nE, nU)))
    reps.append(('>ITER-001 执行</a>', '>执行结果（历史迭代）</a>'))

    # KPI 卡
    reps.append(('>342<small', '>349<small'))
    reps.append(('用例库 = 设计级 205 + 展开级 137<',
                 '用例库 = 设计级 %d + 展开级 %d（另体验级 %d）<' % (nD, nE, nU)))
    reps.append(('>98.0%<small', '>%s%%<small' % exec_rate))
    reps.append((' / 99.2%</small>', ' / %s%%</small>' % pass_rate))
    reps.append(('T1 自动化通过率（Win / Linux ARM64）',
                 '当日执行率 / 通过率（%d 条 × %d 机位 = %d 单元格 · metrics/trend.csv %s）'
                 % (tot['day'], len(mcols), tot['day'] * len(mcols), date)))
    reps.append(('>10/10</div>', '>%d</div>' % len(mcols)))
    reps.append(('客户端安装落位 · 协议层 39 工具 ×3 一致（+check_update/upgrade）',
                 '当日执行客户端机位 · 协议层 39 工具 ×3 一致（工具数沿用原快照口径，未取数（待补））'))
    reps.append(('>10+1</div>', '>58</div>'))
    reps.append(('P 类确定性缺陷（6 既有 + OBS-9/10/11 + OfficeAce 集成 + #554 未修复 P0）',
                 '当日 BLOCKED 阻塞用例（设计级 58 · P0 阻塞 11 项 · 专项分析 %s）' % date))
    reps.append(('>#578</div>', '>%d</div>' % nU))
    reps.append(('上游最新 #578（critical，huawei-iac 审批 token 跨调用）；我方链 #557-#565 全 triaged · #554 P0 未修复',
                 '体验级用例（test-cases/ux/用例矩阵-体验级.csv · 独立分区）'))
    reps.append(('>100%</div>', '>%d</div>' % nD))
    reps.append(('设计级 205 定义（138 已评估 = 通过 129 + 缺陷观察 8 + 环境缺口 1；新增 67 待执行；仓库母版回流）',
                 '设计级定义（P0 %d / P1 %d / P2 %d · CSV 真源）· 展开级 %d · 体验级 %d'
                 % (pri_cnt['P0'], pri_cnt['P1'], pri_cnt['P2'], nE, nU)))

    # 二、十维度
    reps.append(('二、十维度定义与用例分布（设计级 205 条 · CSV 真源）',
                 '二、十维度定义与用例分布（设计级 %d 条 · CSV 真源）' % nD))
    reps.append(('>P0 19 / P1 109 / P2 77<',
                 '>P0 %d / P1 %d / P2 %d<' % (pri_cnt['P0'], pri_cnt['P1'], pri_cnt['P2'])))
    reps.append(('uninstall 生命周期</td><td>60</td>',
                 'uninstall 生命周期</td><td>%d</td>' % dim_cnt['D1安装']))
    reps.append(('C4 服务矩阵展开 22</td><td>36</td>',
                 'C4 服务矩阵展开 22</td><td>%d</td>' % dim_cnt['D3功能']))
    reps.append(('Microsoft 三层模型）</td><td>11</td>',
                 'Microsoft 三层模型）</td><td>%d</td>' % dim_cnt['D9协议']))
    # 条形图（逐行精确替换，宽度 = 条数 / 最大值）
    maxv = max(dim_cnt[d] for d in DIMS)
    OLD_BAR = {
        'D1安装': ('style="width:100%"', 60, ''),
        'D2认证': ('style="width:45%"', 27, ''),
        'D3功能': ('style="width:60%"', 36, ''),
        'D4安全': ('style="background:var(--p0);width:48%"', 29, 'background:var(--p0);'),
        'D5客户端': ('style="width:13%"', 8, ''),
        'D6性能': ('style="width:15%"', 9, ''),
        'D7兼容': ('style="width:10%"', 6, ''),
        'D8质量': ('style="width:17%"', 10, ''),
        'D9协议': ('style="width:18%"', 11, ''),
        'D10评测': ('style="width:15%"', 9, ''),
    }
    for d in DIMS:
        old_style, old_n, extra = OLD_BAR[d]
        cnt = dim_cnt[d]
        w = round(cnt / maxv * 100)
        reps.append((
            '<span>%s</span><div class="track"><div class="fill" %s></div></div><span class="n">%d</span></div>'
            % (DIM_LABEL[d], old_style, old_n),
            '<span>%s</span><div class="track"><div class="fill" style="%swidth:%d%%"></div></div><span class="n">%d</span></div>'
            % (DIM_LABEL[d], extra, w, cnt)))

    # 三、用例库
    reps.append(('>205</b></td><td data-page-node-id="oVd8acjOEy1l7qH86tedkw">D1–D10 全维原子用例，12 列字段',
                 '>%d</b></td><td data-page-node-id="oVd8acjOEy1l7qH86tedkw">D1–D10 全维原子用例，12 列字段' % nD))
    reps.append(('已同步 205 条（仓库母版回流，check_docs 0 问题）',
                 '已同步 %d 条（仓库母版回流，check_docs 0 问题）' % nD, 2))

    # 历史迭代章节：标注"历史"，去掉作为最新迭代的表述
    reps.append(('四、ITER-002-2026-09-08 执行结果（跨夜终版）',
                 '四、历史迭代执行归档 ITER-002（2026-09-08 · 跨夜终版）'))
    reps.append(('四·D、ITER-004-2026-09-10 执行结果（NR3 存量用户版本升级提醒 + issues 回归）',
                 '四·D、历史迭代 ITER-004（2026-09-10）执行结果（NR3 存量用户版本升级提醒 + issues 回归）'))
    reps.append(('四·C、ITER-003-2026-09-09 执行结果（问题验证+每日例行）',
                 '四·C、历史迭代 ITER-003（2026-09-09）执行结果（问题验证+每日例行）'))
    reps.append(('四·B、ITER-002-2026-09-08 执行结果（跨夜终版）',
                 '四·B、历史迭代 ITER-002（2026-09-08）执行结果（跨夜终版）'))
    reps.append(('Win 98.0%</span>（245/250）', 'Win 98.0%</span>'))
    reps.append(('Linux ARM64 99.2%</span>（248/250）', 'Linux ARM64 99.2%</span>'))
    reps.append(('设计级 138（123 既有 + 15 NR3）/ 评审稿 245 条 ALL PASS',
                 '设计级矩阵 NR3 15 新用例入阵 · 评审稿 ALL PASS'))

    # 三·B 用例执行状态总览
    reps.append((
        '<h2 data-page-node-id="case-status-h2">三·B、用例执行状态总览（205 条：138 已评估 + 67 待执行） <span class="tag">✅ 129 通过 · ⚠️ 8 缺陷观察 · 🧩 1 环境缺口 · ⏳ 67 待执行</span></h2>',
        '<h2 data-page-node-id="case-status-h2">三·B、用例执行状态总览（设计级 %d · 当日（%s）执行口径） <span class="tag">当日 %d 条 × %d 机位 · 执行率 %s%% / 通过率 %s%%</span></h2>'
        % (nD, date, tot['day'], len(mcols), exec_rate, pass_rate)))
    reps.append((
        '<p class="muted">逐条「执行状态 + 测试结果」见 xlsx「测试矩阵-设计级」M/N 列（205 条）与「测试矩阵-展开级」H/I 列（137 条，随源用例映射）。新增用例标注「待执行」。此处为汇总口径：</p>',
        '<p class="muted">逐条「执行状态 + 测试结果」见 xlsx「测试矩阵-设计级」M/N 列（%d 条）与「测试矩阵-展开级」H/I 列（%d 条，随源用例映射）。执行状态真源：results/Summary/用例矩阵-设计级-总执行结果-%s.csv（当日 %d 条 × %d 机位 = %d 单元格）；跨日趋势 metrics/trend.csv。此处为按维度汇总口径：</p>'
        % (nD, nE, date, tot['day'], len(mcols), tot['day'] * len(mcols))))

    # 执行状态表（按维度）
    thead = ('<tr><th>维度</th><th>设计级总数</th><th>当日用例数</th><th>✅ 全机位 PASS</th>'
             '<th>⚠️ 含 FAIL/SPEC</th><th>🧩 含 BLOCKED</th><th>⏳ 含 NOT_RUN/未回填</th>'
             '<th>未纳入当日</th></tr>')
    trs = [thead]
    for d in DIMS:
        b = bucket[d]
        trs.append('<tr><td>%s</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td></tr>'
                   % (DIM_LABEL[d], dim_cnt[d], b['day'], b['allpass'], b['failspec'], b['blocked'],
                      b['notrun'], dim_cnt[d] - b['day']))
    trs.append('<tr><td><b>合计</b></td><td><b>%d</b></td><td><b>%d</b></td><td><b>%d</b></td>'
               '<td><b>%d</b></td><td><b>%d</b></td><td><b>%d</b></td><td><b>%d</b></td></tr>'
               % (nD, tot['day'], tot['allpass'], tot['failspec'], tot['blocked'], tot['notrun'],
                  nD - tot['day']))
    old_tbl_re = re.compile(r'<table data-page-node-id="case-status-tbl">.*?</table>', re.S)
    new_tbl = '<table data-page-node-id="case-status-tbl">' + ''.join(trs) + '</table>\n' + (
        '    <p class="muted">口径：按用例归类——含任一 FAIL/SPEC-MISMATCH 机位即计入 ⚠️，'
        '其次 🧩 BLOCKED，再 ⏳ NOT_RUN/未回填，其余（%d 机位全 PASS）计入 ✅；优先级 ⚠️ &gt; 🧩 &gt; ⏳。'
        '「未纳入当日」= 设计级总数 − 当日用例数。单元格口径（%d 条 × %d 机位 = %d）：'
        'PASS %d · FAIL %d · BLOCKED %d · SPEC-MISMATCH %d · NOT_RUN %d · 未回填 %d。</p>'
        % (len(mcols), tot['day'], len(mcols), tot['day'] * len(mcols),
           cell['PASS'], cell['FAIL'], cell['BLOCKED'], cell['SPEC-MISMATCH'],
           cell['NOT_RUN'], cell['']))
    assert len(old_tbl_re.findall(html)) == 1, 'case-status-tbl 未唯一命中'
    html = old_tbl_re.sub(lambda m: new_tbl, html)

    reps.append(('⚠️ 缺陷观察清单（6 条 → 4 个 issue）',
                 '⚠️ 缺陷观察清单（历史 ITER-003 观察 · 6 条 → 4 个 issue）'))

    # 七、基建成熟度（注：与三·用例库同一句共 2 处，见下方 expected=2）
    reps.append(('test-cases/ —— 设计级 205 + 展开级 137（CSV 真源）',
                 'test-cases/ —— 设计级 %d + 展开级 %d + 体验级 %d（CSV 真源）' % (nD, nE, nU)))
    # （'已同步 205 条…' 与三·用例库同句，已在上方以 expected=2 处理）

    # 九、缺口
    reps.append(('② 执行覆盖：设计级 138/205 已评估（新增 67 待执行）',
                 '② 执行覆盖：设计级 %d 定义 · 当日 %d 条执行（执行率 %s%% / 通过率 %s%%）'
                 % (nD, tot['day'], exec_rate, pass_rate)))
    reps.append((
        '<p class="muted" data-page-node-id="x5nYHDDmzAIvy2G0pAx52M">设计级 138/205 已评估（通过 129 + 缺陷观察 8 + 环境缺口 1）；新增 67 条为仓库母版 2026-09-19 回流后待补测（D1 更新检测细分 30 / D3 功能维度 16 / D2 认证 7 / D4 安全 6 / 其余 8）。metrics 原子执行记录口径不变。缺陷：#561-565 已补齐；#554 未修复（P0，Windows 更新检测）。</p>',
        '<p class="muted" data-page-node-id="x5nYHDDmzAIvy2G0pAx52M">设计级全量 %d 条（CSV 真源）；当日流水线执行 %d 条 × %d 机位 = %d 单元格（执行率 %s%% / 通过率 %s%% · metrics/trend.csv），其余 %d 条未纳入当日子集（按 P0 必测 / P1 应测 / P2 可测与禁止剪枝集逐日轮换）。缺陷：#561-565 已补齐；#554 未修复（P0，Windows 更新检测）。</p>'
        % (nD, tot['day'], len(mcols), tot['day'] * len(mcols), exec_rate, pass_rate, nD - tot['day'])))
    reps.append((
        '<span class="warn" data-page-node-id="9Bx9uw17swd2O27sOVMCdJ">进行中</span>（定义 205 条完整；已评估 138/205，新增 67 待执行）',
        '<span class="warn" data-page-node-id="9Bx9uw17swd2O27sOVMCdJ">进行中</span>（定义 %d 条完整；当日 %d 条 × %d 机位执行 · 执行率 %s%% / 通过率 %s%%）'
        % (nD, tot['day'], len(mcols), exec_rate, pass_rate)))

    # footer
    reps.append((
        '（main @ e09ab4e1，2026-09-21 同步 · 仓库母版回流（设计级 205 / 展开级 137））',
        '（%s 同步 · 真源：设计级 %d + 展开级 %d + 体验级 %d；当日执行 results/Summary/用例矩阵-设计级-总执行结果-%s.csv · metrics/trend.csv）'
        % (date, nD, nE, nU, date)))

    # ---------- 应用替换 ----------
    miss = []
    for item in reps:
        old, new = item[0], item[1]
        exp = item[2] if len(item) > 2 else 1
        c = html.count(old)
        if c != exp:
            miss.append((c, exp, old[:70]))
        else:
            html = html.replace(old, new)
    if miss:
        log('!! 替换命中次数非预期:')
        for c, exp, s in miss:
            log('   got=%d expected=%d  %s' % (c, exp, s))
        raise SystemExit('替换失败(未落盘)')

    with io.open(HTML, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    log('HTML 已写回:', HTML, os.path.getsize(HTML), 'bytes')

    # ---------- xlsx upsert ----------
    wb = openpyxl.load_workbook(XLSX)

    def find_sum(ws):
        for r in range(1, ws.max_row + 1):
            v = ws.cell(row=r, column=1).value
            if v is not None and str(v).startswith('合计'):
                return r
        return None

    def upsert(ws, records, cols, status_col, result_col):
        id_row = {}
        sum_row = find_sum(ws)
        data_end = (sum_row - 1) if sum_row else ws.max_row
        for r in range(3, data_end + 1):
            v = ws.cell(row=r, column=1).value
            if v is not None and str(v).strip():
                id_row[str(v).strip()] = r
        tpl = data_end
        tplsum = sum_row or data_end + 1
        new_recs = []
        n_upd = 0
        for rec in records:
            iid = rec['ID'].strip()
            if iid in id_row:
                r = id_row[iid]
                for ci, col in enumerate(cols, 1):
                    ws.cell(row=r, column=ci, value=(rec[col] if rec[col] is not None else ''))
                n_upd += 1
            else:
                new_recs.append(rec)
        write_r = sum_row or data_end + 1
        # 先把旧合计行的合并单元格拆掉（否则会被新数据行占用而错位）
        if sum_row:
            for mc in list(ws.merged_cells.ranges):
                if mc.min_row == sum_row and mc.max_row == sum_row:
                    ws.unmerge_cells(str(mc))
        for rec in new_recs:
            r = write_r
            for ci, col in enumerate(cols, 1):
                cc = ws.cell(row=r, column=ci, value=(rec[col] if rec[col] is not None else ''))
                cpy(cc, ws.cell(row=tpl, column=ci))
            sc = ws.cell(row=r, column=status_col, value='待执行')
            cpy(sc, ws.cell(row=tpl, column=status_col))
            rc = ws.cell(row=r, column=result_col, value='仓库母版回流（待执行）')
            cpy(rc, ws.cell(row=tpl, column=result_col))
            write_r += 1
        new_sum = write_r
        for ci in range(1, max(status_col, result_col) + 1):
            cpy(ws.cell(row=new_sum, column=ci), ws.cell(row=tplsum, column=ci))
        removed = set(id_row) - {r['ID'].strip() for r in records}
        return len(new_recs), n_upd, new_sum, removed

    # 设计级
    ws = wb['测试矩阵-设计级']
    ws.cell(row=1, column=1, value='测试矩阵 · 设计级用例（%d 条 · D1–D10）' % nD)
    nadd, nupd, newsum, removed = upsert(ws, design, DESIGN_COLS, 13, 14)
    de = newsum - 1
    cnt = Counter(str(ws.cell(row=r, column=13).value or '').strip() for r in range(3, de + 1))
    ws.cell(row=newsum, column=1, value='合计 %d 条' % nD)
    ws.cell(row=newsum, column=13, value='通过 %d · 缺陷观察 %d · 环境缺口 %d · 待执行 %d'
            % (cnt.get('通过', 0), cnt.get('缺陷观察', 0), cnt.get('环境缺口', 0), cnt.get('待执行', 0)))
    ws.cell(row=newsum, column=14, value='%d 定义（CSV 真源；新增回流 %d 条标「待执行」）' % (nD, nadd))
    if 'A%d:B%d' % (newsum, newsum) not in [str(m) for m in ws.merged_cells.ranges]:
        ws.merge_cells('A%d:B%d' % (newsum, newsum))
    log('设计级: 新增 %d / 更新 %d / 合计行 R%d / 母版已删 %s' % (nadd, nupd, newsum, sorted(removed)))

    # 展开级
    ws = wb['测试矩阵-展开级']
    typ = Counter(r['展开类型'].strip() for r in expanded if r.get('展开类型', '').strip())
    ws.cell(row=1, column=1, value='测试矩阵 · 展开级用例（%d 条 · %s）'
            % (nE, ' / '.join('%s %d' % (k, v) for k, v in sorted(typ.items()))))
    nadd2, nupd2, newsum2, removed2 = upsert(ws, expanded, EXPAND_COLS, 8, 9)
    de2 = newsum2 - 1
    cnt2 = Counter(str(ws.cell(row=r, column=8).value or '').strip() for r in range(3, de2 + 1))
    ws.cell(row=newsum2, column=1, value='合计 %d 条' % nE)
    ws.cell(row=newsum2, column=8, value='通过 %d · 缺陷观察 %d · 环境缺口 %d · 未映射 %d · 待执行 %d'
            % (cnt2.get('通过', 0), cnt2.get('缺陷观察', 0), cnt2.get('环境缺口', 0),
               cnt2.get('未映射', 0), cnt2.get('待执行', 0)))
    if 'A%d:B%d' % (newsum2, newsum2) not in [str(m) for m in ws.merged_cells.ranges]:
        ws.merge_cells('A%d:B%d' % (newsum2, newsum2))
    log('展开级: 新增 %d / 更新 %d / 合计行 R%d / 母版已删 %s' % (nadd2, nupd2, newsum2, sorted(removed2)))

    # 总览 + 验收标准
    ws = wb['总览']
    sub = [('仓库母版回流 2026-09-21（设计级 205 / 展开级 137）',
            '仓库母版回流 %s（设计级 %d + 展开级 %d + 体验级 %d）' % (date, nD, nE, nU)),
           ('设计级 205 + 展开级 137（仓库母版回流，新增待执行）',
            '设计级 %d + 展开级 %d + 体验级 %d（CSV 真源，%s）' % (nD, nE, nU, date))]
    for r in range(1, ws.max_row + 1):
        for c in range(1, ws.max_column + 1):
            v = ws.cell(row=r, column=c).value
            if not isinstance(v, str):
                continue
            s = v
            for a, b in sub:
                s = s.replace(a, b)
            if '测试用例' in s and '342' in s:
                s = s.replace('342', str(nD + nE))
            if 'MCP 工具 39' in s:
                s = s.replace('MCP 工具 39', 'MCP 工具 39（沿用原快照口径）')
            if s != v:
                ws.cell(row=r, column=c, value=s)
    ws = wb['验收标准']
    for r in range(1, ws.max_row + 1):
        v = ws.cell(row=r, column=3).value
        if isinstance(v, str) and ('设计级评估完成' in v or '设计级 205 定义' in v):
            ws.cell(row=r, column=3, value='设计级 %d 定义（CSV 真源）；当日 %d 条 × %d 机位执行 · '
                    '执行率 %s%% / 通过率 %s%%（metrics/trend.csv %s）'
                    % (nD, tot['day'], len(mcols), exec_rate, pass_rate, date))
    wb.save(XLSX)
    log('XLSX 已写回:', XLSX)
    log('DONE', ts)


if __name__ == '__main__':
    main()