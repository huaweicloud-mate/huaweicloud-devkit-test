# -*- coding: utf-8 -*-
import csv, io
from collections import Counter
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-05-188.239.14.150\Windows'
def rd(f):
    return list(csv.DictReader(open(base+'\\'+f, encoding='utf-8-sig')))

design = rd('用例矩阵-设计级.csv')
exp = rd('用例矩阵-展开级.csv')
trace = rd('需求-设计-证据追踪表.csv')

out = io.open(base+'\\_inspect.txt','w',encoding='utf-8')
out.write('DESIGN rows=%d\n' % len(design))
pc = Counter(x['优先级'] for x in design)
out.write('DESIGN by priority: %s\n' % dict(pc))
real = [x['ID'] for x in design if ('真云' in (x.get('requiredEvidence') or '') or '建删' in (x.get('预期结果') or '') or '真机' in (x.get('预期结果') or ''))]
out.write('真云/建删 candidates: %s\n\n' % real)
for x in design:
    out.write('='*80 + '\n')
    out.write('ID=%s P=%s %s\n' % (x['ID'], x['优先级'], x['标题']))
    out.write('  dim=%s ev=%s\n' % (x['维度'], (x.get('requiredEvidence') or '')[:120]))
    out.write('  exp=%s\n' % x['预期结果'][:300])

out.write('\n\n' + '='*80 + '\n')
out.write('EXPAND rows=%d\n' % len(exp))
out.write('EXPAND by priority: %s\n' % dict(Counter(x['优先级'] for x in exp)))
for x in exp:
    out.write('-'*70 + '\n')
    out.write('ID=%s P=%s %s (src=%s)\n' % (x['ID'], x['优先级'], x['展开类型'], x['源用例']))
    out.write('  agent=%s OS=%s dim=? ev=%s\n' % (x.get('agent'), x.get('OS'), (x.get('requiredEvidence') or '')[:80]))
    out.write('  exp=%s\n' % x['预期结果'][:300])

out.write('\n\n' + '='*80 + '\n')
out.write('TRACE rows=%d\n' % len(trace))
out.close()
print('written')