# -*- coding: utf-8 -*-
import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
rows = list(csv.DictReader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
lines = []
for r in rows:
    lines.append('%s | %s | agent=%s | os=%s | term=%s | %s' % (
        r['ID'], r['优先级'], r['agent'], r['OS'], r['终端覆盖类型'], (r['标题'] or '')[:70]))
open('_list_design.txt', 'w', encoding='utf-8').write('\n'.join(lines))
print('design rows:', len(rows))
exp = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
lines2 = []
for r in exp:
    lines2.append('%s | %s | agent=%s | os=%s | %s' % (
        r['ID'], r.get('优先级',''), r.get('agent',''), r.get('OS',''), (r.get('标题') or '')[:70]))
open('_list_exp.txt', 'w', encoding='utf-8').write('\n'.join(lines2))
print('expanded rows:', len(exp))
mis = list(csv.DictReader(open('使命-mission-001.csv', encoding='utf-8-sig')))
lines3 = []
for r in mis:
    lines3.append('%s | %s | %s | %s' % (r.get('ID',''), r.get('优先级',''), r.get('关联用例',''), (r.get('标题') or '')[:70]))
open('_list_mission.txt', 'w', encoding='utf-8').write('\n'.join(lines3))
print('mission rows:', len(mis))
