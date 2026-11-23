import csv, io, os, sys

base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, '_cases_all.txt'), 'w', encoding='utf-8')

def dump(f, fields, name):
    rows = list(csv.DictReader(io.open(os.path.join(base, f), encoding='utf-8-sig')))
    out.write('\n\n########## %s (%d cases) ##########\n' % (name, len(rows)))
    for r in rows:
        out.write('--- CASE %s | P=%s\n' % (r.get('ID', ''), r.get('优先级', '')))
        for fld in fields:
            v = (r.get(fld) or '').strip()
            if v:
                out.write('  [%s] %s\n' % (fld, v.replace('\n', ' | ')))

dump('用例矩阵-设计级.csv',
     ['维度', '标题', '前置条件', '测试数据', '操作步骤', '预期结果', '关联工具',
      'requiredEvidence', '依赖', '终端覆盖类型', 'agent', 'OS', 'Node/npm', 'shell',
      'TTY', 'installLayout', 'mcpTransport', 'hookSupport', '自动化建议', '展开规则'],
     'DESIGN')
dump('用例矩阵-展开级.csv',
     ['展开类型', '枚举对象', '源用例', '执行要点', '预期结果', 'requiredEvidence',
      'terminalType', 'agent', 'OS', 'Node/npm', 'shell', 'TTY', 'installLayout',
      'mcpTransport', 'hookSupport'],
     'EXPANDED')
dump('使命-mission-001.csv',
     ['mission', 'missionPriority', '维度', '标题', '前置条件', '测试数据', '操作步骤',
      '预期结果', '关联工具', 'requiredEvidence', '依赖', '终端覆盖类型', 'agent', 'OS',
      'Node/npm', 'shell', 'TTY', 'installLayout', 'mcpTransport', 'hookSupport', '自动化建议'],
     'MISSION')
out.close()
print('done')
