# -*- coding: utf-8 -*-
import csv, os
base = os.path.dirname(os.path.abspath(__file__))
des = {r['ID']: r for r in csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig'))}
exp = {r['ID']: r for r in csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig'))}
ids = ['EXP-D5-7-1','EXP-D5-7-3','D9-10','D9-11','D9-12','D9-13','D4-28','D4-29','D4-25','D4-26','D10-3','D10-4','D8-9','D8-10','D6-9','D2-27','D3-C13','D3-C14']
for cid in ids:
    r = des.get(cid) or exp.get(cid)
    if not r:
        print(f'##### {cid} NOT FOUND'); continue
    print('='*70)
    print(f"{cid} [{r.get('优先级')}] {r.get('标题','')}")
    print(f"展开类型={r.get('展开类型','')} 枚举对象={r.get('枚举对象','')} 源用例={r.get('源用例','')}")
    print(f"agent={r.get('agent','')} | OS={r.get('OS','')}")
    print(f"指引来源={r.get('指引来源','')[:400]}")
    print(f"步骤={(r.get('操作步骤') or r.get('执行要点') or '')[:500]}")
    print(f"预期={(r.get('预期结果') or '')[:500]}")
    print(f"requiredEvidence={r.get('requiredEvidence','')}")
    print()