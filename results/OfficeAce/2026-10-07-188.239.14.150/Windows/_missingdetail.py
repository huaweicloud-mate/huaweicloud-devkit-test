# -*- coding: utf-8 -*-
import csv, os
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
missing = ['D1-65','D1-66','D1-67','D1-68','D1-69','D1-70','D2-27','D3-C13','D3-C14',
           'D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8',
           'D4-25','D4-26','D4-28','D4-29','D6-9','D8-9','D8-10','D9-10','D9-11','D9-12','D9-13',
           'EXP-D5-7-1','EXP-D5-7-3']
des = {r['ID']: r for r in csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig'))}
exp = {r['ID']: r for r in csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig'))}
for cid in missing:
    r = des.get(cid) or exp.get(cid)
    if not r:
        print(f'==== {cid} NOT FOUND'); continue
    print(f'########## {cid} [{r.get("优先级")}] {r.get("标题","")}')
    print('前置条件:', (r.get('前置条件') or r.get('执行要点') or '')[:500])
    print('步骤:', (r.get('操作步骤') or '')[:800])
    print('预期:', (r.get('预期结果') or '')[:800])
    print('指引来源:', (r.get('指引来源') or '')[:200], '| 关联工具:', (r.get('关联工具') or '')[:200])
    print('agent:', r.get('agent'), '| OS:', r.get('OS'), '| 依赖:', r.get('依赖',''))
    print()