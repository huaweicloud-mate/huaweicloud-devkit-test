# -*- coding: utf-8 -*-
import csv, os, json
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
missing = ['D1-65','D1-66','D1-67','D1-68','D1-69','D1-70','D2-27','D3-C13','D3-C14',
           'D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8',
           'D4-25','D4-26','D4-28','D4-29','D6-9','D8-9','D8-10','D9-10','D9-11','D9-12','D9-13',
           'EXP-D5-7-1','EXP-D5-7-3']
des = {r['ID']: r for r in csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig'))}
exp = {r['ID']: r for r in csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig'))}
out = []
for cid in missing:
    r = des.get(cid) or exp.get(cid)
    if not r: continue
    out.append('='*70)
    out.append(f"{cid} [{r.get('优先级')}] {r.get('标题','')} | 终端覆盖类型={r.get('终端覆盖类型','')} | terminal={r.get('terminal','')} | agent={r.get('agent','')}")
    out.append(f"OS={r.get('OS','')} | owner={r.get('owner','')} | 指引来源={r.get('指引来源','')[:300]}")
    out.append(f"步骤={ (r.get('操作步骤') or r.get('执行要点') or '')[:600] }")
    out.append(f"预期={ (r.get('预期结果') or '')[:600] }")
    out.append(f"关联工具={r.get('关联工具','')[:200]}")
    out.append('')
path = os.path.join(base, '_missing_key.txt')
open(path, 'w', encoding='utf-8').write('\n'.join(out))
print('written', len(out), 'lines')