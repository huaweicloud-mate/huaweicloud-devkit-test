# -*- coding: utf-8 -*-
import json, io, csv
for cid in ['d2-auth', 'd4-security', 'mcp-tools']:
    j = json.load(io.open('evidence/' + cid + '/stdout.log', encoding='utf-8-sig'))
    print('=' * 70)
    print(cid, 'total', j.get('total'), 'passed', j.get('passed'), 'failed', j.get('failed'))
    for r in j['results']:
        if not r.get('pass'):
            print('  FAIL id=%s name=%s' % (r.get('id'), r.get('name')))
            print('      expected=%r' % r.get('expected'))
            print('      actual  =%r' % (r.get('actual')))
            print('      failMsg =%r' % r.get('failMsg'))
print()
r = list(csv.DictReader(io.open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
for x in r:
    if x['ID'] in ('D4-27', 'D2-4'):
        print(x['ID'], '|', x['优先级'], '|', x['标题'], '|', (x['预期结果'] or '')[:160])