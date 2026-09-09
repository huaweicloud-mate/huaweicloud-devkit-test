# -*- coding: utf-8 -*-
"""panorama-update-iter003.py - 全景图 ITER-003 内容回流
- 更新快照时间/chips
- 插入 ITER-003 验证 section
- 同步 ITER-003 归档件（panorama/ITER-003-2026-09-09.html）
用法: python panorama-update-iter003.py <全景图html路径>
"""
import re, sys, shutil, os

src = sys.argv[1]
h = open(src, encoding='utf-8').read()
orig = h

# 1. 快照时间
h = h.replace('数据快照 2026-09-09 00:50（ITER-002 收尾）',
              '数据快照 2026-09-09（ITER-003 问题验证+D10-6 评测基建建成）')

# 2. chips 更新（发现 tag 增加 ITER-003 验证结论）
h = h.replace('24 项 · #557-565 全部独立提单 · #560 已解决 · #557/558/559 上游已转派',
              '24 项 · #557-565 全部独立提单 · #560 已解决(发布线验证✅) · #557-565 全 triaged · #554 复验未修复❌')

# 3. 在 ITER-002 执行结果 section 前插入 ITER-003 section
iter003_section = '''<!-- ============ ITER-003 执行结果 ============ -->
    <h2>四·C、ITER-003-2026-09-09 执行结果（问题验证+每日例行） <span class="tag">基线 1.1.2-next.4（608b120）无漂移 · D10-6 评测基建建成</span></h2>
    <table>
      <tr><th>项</th><th>结果</th><th>证据</th></tr>
      <tr><td><b>上游 issue 状态同步</b></td><td>36 open 全量拉取；本批 9 issue（#557-565）<b>全部 triage 确认</b>（8 open 转派 + #560 修复闭环）；无一驳回</td><td>Google/GitHub API 快照（ITER-003/问题验证记录.md §1）</td></tr>
      <tr><td><b>#560 CLOSE_TIMEOUT 修复验证</b></td><td>✅ 修复已进发布线：608b120 mcp-server.mjs <code>NEEDS_KEEPALIVE = hermes && win32</code>，其他宿主 stdin close → <code>process.exit(0)</code></td><td>源码实证（§2.3）</td></tr>
      <tr><td><b>#554 Windows 更新检测</b></td><td>❌ <b>1.1.2-next.4 仍未修复</b>：spawnSync(npm.cmd) 无 shell:true → EINVAL（对照 shell:true status=0 ✅，网络正常 ✅）——Windows 会话级更新检测失效</td><td>evidence/verify-554b.mjs 对照实验（§2.1）</td></tr>
      <tr><td><b>#518 README mirror-lag</b></td><td>✅ dev 已合入 #566 修复（仅 dev 未进 next），我们上报的文档问题上游已响应</td><td>git log 306c633（§2.2）</td></tr>
      <tr><td><b>#555 / #556 uninstall 缺陷</b></td><td>⭕ dev/next 均无修复 commit，open triaged 转派中（破坏性不本机实测）</td><td>git log --all --grep（§2.4）</td></tr>
      <tr><td><b>D10-6 评测基建</b></td><td>✅ <b>建成 v1</b>（测试侧交付完成）：eval/ 目录 + eval-set-v1.csv（15 条，从展开级 EXP-E01~E15 抽取）+ 可重复跑原则文档——覆盖口径从"1 环境缺口"清零</td><td>eval/README.md + prompts/eval-set-v1.csv</td></tr>
      <tr><td><b>基线滚动（每日例行）</b></td><td>✅ npm dist-tags 无漂移（latest=1.1.1 / next=1.1.2-next.4）；dev +24 commits（telemetry/auth/#566）均未发布——ITER-002 全部结论保持有效</td><td>registry 直连 + git fetch（§2.5）</td></tr>
      <tr><td><b>D8 文档一致性</b></td><td>✅ 4/4 项（命令一致性脚本修复 stopword 误报后全过）</td><td>check_readme_consistency.py</td></tr>
    </table>
    <p class="note">▶ 全景图每日归档流程启用：panorama/ 目录专门存放（用户要求 2026-09-09 起），当日快照随 commit 版本化。</p>

'''

anchor = '<!-- ============ ITER-002 执行结果 ============ -->'
assert anchor in h, 'anchor ITER-002 执行结果 not found'
h = h.replace(anchor, iter003_section + anchor)

# 4. 校验：新旧值都没残留
assert '00:50（ITER-002 收尾）' not in h
assert '#560 已解决 · #557/558/559 上游已转派' not in h
# section 配平
assert h.count('<section') == h.count('</section') or '<section' not in h, 'section mismatch'
assert h.count('<table') == h.count('</table>'), f"table mismatch {h.count('<table')} vs {h.count('</table>')}"
# ITER-003 内容在
for probe in ['四·C、ITER-003-2026-09-09', 'NEEDS_KEEPALIVE', 'verify-554b', 'eval-set-v1.csv', '#560 已解决(发布线验证✅)', 'ITER-003 问题验证+D10-6']:
    assert probe in h, f'missing: {probe}'

open(src, 'w', encoding='utf-8').write(h)
print(f'OK updated: {src}')
print(f'  size {len(orig)} -> {len(h)}')