# -*- coding: utf-8 -*-
import csv, io, os
base = os.path.dirname(os.path.abspath(__file__))
os.chdir(base)

def dump(fname, outname):
    rows = list(csv.DictReader(io.open(fname, encoding='utf-8-sig')))
    out = io.open(outname, 'w', encoding='utf-8')
    for r in rows:
        cid = r.get('ID') or ''
        out.write('=== %s | P=%s | %s\n' % (cid, r.get('优先级'), (r.get('标题') or '').strip()))
        if r.get('维度'): out.write('维度: %s\n' % r['维度'])
        if r.get('前置条件'): out.write('前置: %s\n' % r['前置条件'])
        if r.get('测试数据'): out.write('数据: %s\n' % r['测试数据'])
        if r.get('操作步骤'): out.write('步骤: %s\n' % r['操作步骤'])
        if r.get('预期结果'): out.write('预期: %s\n' % r['预期结果'])
        if r.get('关联工具'): out.write('工具: %s\n' % r['关联工具'])
        if r.get('requiredEvidence'): out.write('证据: %s\n' % r['requiredEvidence'])
        if r.get('终端覆盖类型'): out.write('终端覆盖: %s\n' % r['终端覆盖类型'])
        if r.get('OS'): out.write('OS: %s\n' % r['OS'])
        if r.get('agent'): out.write('agent: %s\n' % r['agent'])
        if r.get('展开类型'): out.write('展开类型: %s | 枚举对象: %s | 源: %s\n' % (r.get('展开类型'), r.get('枚举对象'), r.get('源用例')))
        if r.get('执行要点'): out.write('要点: %s\n' % r['执行要点'])
        out.write('\n')
    out.close()
    print('wrote', outname, len(rows))

dump('用例矩阵-设计级.csv', '_design_full.txt')
dump('用例矩阵-展开级.csv', '_exp_full.txt')
