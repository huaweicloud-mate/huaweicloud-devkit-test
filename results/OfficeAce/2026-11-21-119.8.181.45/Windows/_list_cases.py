# -*- coding: utf-8 -*-
import csv, io, os, sys
d = os.path.dirname(os.path.abspath(__file__))
try:
    rows = list(csv.DictReader(io.open(os.path.join(d, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
    print('EXP', len(rows))
    for r in rows:
        print('|'.join(str(r.get(k, '')) for k in ['expandedCaseId', 'designCaseId', '优先级', '枚举对象', '执行要点', 'OS', 'agent']))
    print('===DESIGN===')
    drows = list(csv.DictReader(io.open(os.path.join(d, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
    print('DES', len(drows))
    print('DFIELDS:', list(drows[0].keys()))
    for r in drows:
        print('|'.join(str(r.get(k, '')) for k in ['用例ID', 'ID', '维度', '优先级', '关联工具', 'OS', '专属']))
except Exception:
    import traceback
    traceback.print_exc()
sys.stdout.flush()
