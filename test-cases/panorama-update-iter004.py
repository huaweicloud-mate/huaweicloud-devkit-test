# -*- coding: utf-8 -*-
"""panorama-update-iter004.py - 全景图 ITER-004 内容回流（HTML）
- 更新快照时间/chips/KPI/十维标题/缺口口径/footer
- 插入 ITER-004 执行结果 section（NR3 15 用例 + issues 回归）
- 数值动态读 CSV 真源（设计级 138/维度分布/优先级分布）
用法: python panorama-update-iter004.py <全景图html路径>
"""
import re, sys, csv, os

src = sys.argv[1]
h = open(src, encoding='utf-8').read()
orig = h

# ---- 动态数值（CSV 真源）----
CSV = r'C:\Users\Administrator\devkit-test\huaweicloud-devkit-test\test-cases\design\用例矩阵-设计级.csv'
rows = list(csv.DictReader(open(CSV, encoding='utf-8-sig')))
dims = {}
prio = {}
d1 = 0
for r in rows:
    id_ = r['ID']; dim = r['维度']; p = r['优先级']
    dims[dim] = dims.get(dim, 0) + 1
    prio[p] = prio.get(p, 0) + 1
    if id_.startswith('D1-'):
        d1 += 1
n_design = len(rows); n_total = n_design + 107
p0, p1, p2 = prio.get('P0', 0), prio.get('P1', 0), prio.get('P2', 0)
print(f"真源: 设计级 {n_design} / 合计 {n_total} / P0 {p0} P1 {p1} P2 {p2} / D1 {d1} 条")
dim_str = ' · '.join(f"{k}{v}" for k, v in dims.items())

# ---- 1. kicker 快照时间 ----
old_kicker = '测试体系全景 · 数据快照 2026-09-09（ITER-003 问题验证+D10-6 评测基建建成）'
new_kicker = '测试体系全景 · 数据快照 2026-09-10（ITER-004 NR3 版本升级提醒 + issues 回归）'
assert old_kicker in h, 'kicker not found'
h = h.replace(old_kicker, new_kicker)

# ---- 2. chips ----
h = h.replace('用例 230 = 设计级 123 + 展开级 107',
              f'用例 {n_total} = 设计级 {n_design}（含 NR3 新增 15）+ 展开级 107')
h = h.replace('发现 24 项 · issue #501/#518/#530/#557-#565 全部留痕',
              '发现 24+3 项 · #557-#565 全 triaged · #554 未修复 P0（NR3-1）· 新增 NR3-2/3')
h = h.replace('<span class="chip" data-page-node-id="THtrHRDnHQjXM0DGLxxVRE">发现 24 项 · issue #501/#518/#530/#557-#565 全部留痕</span>',
              '<span class="chip" data-page-node-id="THtrHRDnHQjXM0DGLxxVRE">发现 24 项 · issue #501/#518/#530/#557-#565 全部留痕</span>\n      <span class="chip" data-page-node-id="ITER004Chip1">ITER-004：NR3 升级提醒 15 用例（14 通过 / 1 P0）+ issues 回归 9 项（5 解决 / 1 滞后 / 1 未修复）</span>')

# ---- 3. KPI ----
h = h.replace('>230<small', f'>{n_total}<small')
h = h.replace('用例库 = 设计级 123 + 展开级 107',
              f'用例库 = 设计级 {n_design}（含 NR3 新增 15）+ 展开级 107')
h = h.replace('协议层 37 工具 ×3 一致', '协议层 39 工具 ×3 一致（+check_update/upgrade）')
h = h.replace('>9+1</div><div class="lab" data-page-node-id="n56evmqox4AExQjFLIOWeJ">P 类确定性缺陷（6 既有 + OBS-9/10/11 P1 三连 + OfficeAce CLOSE_TIMEOUT 集成）',
              '>10+1</div><div class="lab" data-page-node-id="n56evmqox4AExQjFLIOWeJ">P 类确定性缺陷（6 既有 + OBS-9/10/11 + OfficeAce 集成 + #554 未修复 P0）')
h = h.replace('>#557</div>', '>#578</div>')
h = h.replace('最新 issue 上报链（#501/#518/#530/#557/#558/#559/#560 全独立提单）',
              '上游最新 #578（critical，huawei-iac 审批 token 跨调用）；我方链 #557-#565 全 triaged · #554 P0 未修复')
h = h.replace('>99.2%</div><div class="lab" data-page-node-id="8kaCflFzPmcmTheP5LzUMh">设计级 122/123 评估完成 = 审计留痕73 + 8批补测49 + 缺口1(D10-6)；metrics 原子执行记录 60 条次</div>',
              f'>100%</div><div class="lab" data-page-node-id="8kaCflFzPmcmTheP5LzUMh">设计级 {n_design}/{n_design} 评估完成（ITER-003 123/123 + NR3 新增 15/15 全执行留痕）；metrics 原子执行记录 +=25 条次（NR3 15 + 回归 9 + 探针批次）</div>')

# ---- 4. 十维标题 ----
h = h.replace('二、十维度定义与用例分布（设计级 123 条 · CSV 真源）<span class="tag" data-page-node-id="a4Ga63Jb4eJ7b6GL5yV5RR">P0 16 / P1 65 / P2 42</span>',
              f'二、十维度定义与用例分布（设计级 {n_design} 条 · CSV 真源）<span class="tag" data-page-node-id="a4Ga63Jb4eJ7b6GL5yV5RR">P0 {p0} / P1 {p1} / P2 {p2}</span>')

# ---- 5. 插入 ITER-004 section（ITER-003 anchor 之前）----
iter004_section = f'''<!-- ============ ITER-004 执行结果 ============ -->
    <h2>四·D、ITER-004-2026-09-10 执行结果（NR3 存量用户版本升级提醒 + issues 回归） <span class="tag">1.1.2 正式版（09a59b93）今日 09:22 发布 · D1-39 P0 待修</span></h2>
    <table>
      <tr><th>项</th><th>结果</th><th>证据</th></tr>
      <tr><td><b>NR3 版本升级提醒（D1-26~40，15 新用例入矩阵）</b></td><td>函数级探针 <b>45/46 PASS</b> + MCP 端到端：检测/冷却/降级/兜底/升级语义全通过；<b>唯 D1-39 P0</b></td><td>evidence/d1-uc-probe.mjs · d1-check-update-call.mjs</td></tr>
      <tr><td><b>D1-39 Windows 升级检测链（P0）</b></td><td>❌ <b>spawnSync(npm.cmd) 无 shell:true → EINVAL 实锤</b>（error.code 直捕；对照 shell:true status=0 ✅）——check_update 端到端返回 latestStable=null=静默失败，<b>Windows 存量用户收不到升级提醒</b>（=#554 未修复当前态，1.1.2/next.2 均未修）</td><td>d1-uc-probe.mjs D1-39a~d · d1-check-update-call.mjs</td></tr>
      <tr><td><b>D1-29 文档-实现差异（P3）</b></td><td>设计文档比对表「pre 不提醒 next」，实现 determineTarget 对 pre 用户候选含 latest+next 取最大（stable 优先）——pre 用户会被提醒 next 更新，待开发确认</td><td>d1-uc-probe.mjs D1-29b/c</td></tr>
      <tr><td><b>issues 回归 9 项</b></td><td>✅ 已解决 5：#518（README mirror-lag 1.1.2/next.2 均含 + judgeUpdate 防倒退）/#574（64b253e ∈ 1.1.2，skills 根因纠正）/#520/#516/#560（闭环）；⚠️ #533 修复 afeeb03 在 next 线 <b>未进 1.1.2</b>（发布节奏）；❌ #554 未修复(P0)；部分 #530</td><td>git merge-base 追溯 + 源码实读（测试执行记录.md §二）</td></tr>
      <tr><td><b>矩阵与门面</b></td><td>设计级 {n_design}（123 既有 + 15 NR3）/ 评审稿 {n_total} 条 ALL PASS；README/LATEST/metrics 同步；check_docs 零告警</td><td>gen_matrix.py · verify_review_html.py · check_docs.py</td></tr>
    </table>
    <p class="note">▶ 需求结论：逻辑层完整、Windows 主平台不可用（P0）→ 修复 #554（npm/npx.cmd spawn 统一 shell:true）后复测即可达标；本轮 0 新提单（D1-39 与 #554 同根因）。</p>

'''
anchor = '<!-- ============ ITER-003 执行结果 ============ -->'
assert anchor in h, 'anchor ITER-003 not found'
h = h.replace(anchor, iter004_section + anchor)

# ---- 6. 缺口②口径（122/123 → 138/138）----
h = h.replace('② 执行覆盖评估完成：设计级 122/123（99.2%）= 审计留痕73+补测49+缺口1(D10-6)；metrics 原子执行记录 60 条次（另633验证性批量）',
              f'② 执行覆盖评估完成：设计级 138/138（100%）= ITER-003 123/123 + NR3 新增 15/15 执行留痕')
h = h.replace('设计级 122/123 评估完成（99.2%）= 首轮审计留痕 73 + 8 批补测 49 + 缺口 1（D10-6 评测基建，ITER-003 测试侧交付）；口径修正轨迹：73% 虚高（含批量）→ 61.8% → 69.1% → 评估完成 99.2%。metrics/execution.csv 原子执行记录 = 设计级相关 60 条次（另 633 条次为 T1 单测/冒烟/探针验证性批量，不计设计级）。缺陷：#561-565 已补齐（OBS-12/13/14/15 + 孤儿规则）。',
              '设计级 123/123 评估完成（ITER-003 收口，口径：审计留痕73+8批补测49+缺口清零）+ ITER-004 NR3 新增 15/15 全执行留痕 = 138/138；口径修正轨迹：73% 虚高（含批量）→ 61.8% → 69.1% → 100%。metrics/execution.csv 原子执行记录设计与设计级相关批次累计吻合（另 T1 单测/冒烟/探针为验证性批量不计设计级）。缺陷：#561-565 已补齐（OBS-12/13/14/15 + 孤儿规则）；#554 未修复（P0，Windows 更新检测）。')
h = h.replace('<td data-page-node-id="0PCN7wtdiQvkAbMyKKISEn">达成</span>（设计级评估完成 99.2%=122/123；D10-6 评测基建 ITER-003；metrics 原子记录 60）',
              '<td data-page-node-id="0PCN7wtdiQvkAbMyKKISEn">达成</span>（设计级评估完成 100%=138/138；NR3 15/15；ITER-003 D10-6 交付）')

# ---- 7. 缺口①缺陷闭环加 #554 ----
h = h.replace('① 缺陷闭环：6 既有 P 类 + OBS-9/10/11 新 P1 族 + INT-1，#501/#518/#530/#557/#558/#559/#560 需持续跟踪',
              '① 缺陷闭环：6 既有 P 类 + OBS-9/10/11 新 P1 族 + INT-1 + #554（Windows 更新检测 P0 未修复），#501/#518/#530/#557-#560 已 triaged 需持续跟踪')

# ---- 8. 基建/其它过时行 ----
h = h.replace('test-cases/ —— 设计级 114 + 展开级 107（CSV 真源）+ 生成 / 校验脚本',
              f'test-cases/ —— 设计级 {n_design} + 展开级 107（CSV 真源）+ 生成 / 校验脚本')
h = h.replace('test-cases/README —— 已同步 123 条（ITER-002 修复漂移，check_docs 0 问题）',
              f'test-cases/README —— 已同步 {n_design} 条（ITER-004 修复漂移，check_docs 0 问题）')

# ---- 9. footer ----
h = re.sub(r'（main @ [0-9a-f]+，2026-09-09 00:55 同步 · ITER-002 收尾终版）',
           '（main @ 9d22f39，2026-09-10 同步 · ITER-004 收尾）', h)

# ---- 校验 ----
assert '数据快照 2026-09-10' in h
assert '四·D、ITER-004-2026-09-10' in h
assert f'设计级 {n_design} + 展开级 107' in h
assert 'EINVAL' in h
assert '数据快照 2026-09-09（ITER-003' not in h
assert '230' not in h or '245' in h
assert h.count('<table') == h.count('</table>'), f"table mismatch {h.count('<table')} vs {h.count('</table>')}"
assert h.count('<section') == h.count('</section') or '<section' not in h, 'section mismatch'

open(src, 'w', encoding='utf-8').write(h)
print(f'OK updated: {src}')
print(f'  size {len(orig)} -> {len(h)}')
print(f'  维度分布: {dim_str}')