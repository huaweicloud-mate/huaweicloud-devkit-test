# -*- coding: utf-8 -*-
"""panorama-fix-residual.py - 清理 ITER-004 更新后的残留当前口径值（历史时点事实保留）"""
import sys

src = sys.argv[1]
h = open(src, encoding='utf-8').read()
orig = h

# L516: 定义覆盖率 37 工具 → 39 工具（当前口径）
old516 = '<span class="ok" data-page-node-id="BnI0A7uwFd6JJlBpM2dPSF">基本达成</span>（37 工具 + 30 skill + 20+ 服务）'
new516 = '<span class="ok" data-page-node-id="BnI0A7uwFd6JJlBpM2dPSF">基本达成</span>（39 工具 + 30 skill + 20+ 服务）'
if old516 in h:
    h = h.replace(old516, new516)
    print('fixed L516 37->39')

# L517: 执行覆盖率 99.2%=122/123 → 100%=138/138（完整匹配 span 结构）
old517 = ('<td data-page-node-id="0PCN7wtdiQvkAbMyKKISEn"><span class="warn" data-page-node-id="9Bx9uw17swd2O27sOVMCdJ">达成</span>'
          '（设计级评估完成 99.2%=122/123；D10-6 评测基建 ITER-003；metrics 原子记录 60）')
new517 = ('<td data-page-node-id="0PCN7wtdiQvkAbMyKKISEn"><span class="warn" data-page-node-id="9Bx9uw17swd2O27sOVMCdJ">达成</span>'
          '（设计级评估完成 100%=138/138；NR3 15/15；ITER-003 D10-6 交付）')
if old517 in h:
    h = h.replace(old517, new517)
    print('fixed L517 99.2%->100%')
else:
    print('WARN L517 old pattern not found')

# 终检: 当前口径残留检查（历史的 T1 通过率/ITER-002 表格除外）
residual = [x for x in ['99.2%=122/123', '（37 工具 + 30 skill', '设计级 122/123 评估完成（99.2%）'] if x in h]
print('RESIDUAL(当前口径):', residual if residual else '无')

open(src, 'w', encoding='utf-8').write(h)
print(f'OK size {len(orig)} -> {len(h)}')