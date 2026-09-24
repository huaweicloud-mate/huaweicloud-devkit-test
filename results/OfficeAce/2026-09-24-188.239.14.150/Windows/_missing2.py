# -*- coding: utf-8 -*-
import csv, io
r = list(csv.DictReader(io.open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
missing = {'D1-65','D1-66','D1-67','D1-68','D1-69','D1-70','D2-27','D3-C13','D3-C14','D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8','D4-25','D4-26','D4-29','D6-9','D8-9','D8-10','D9-10','D9-11','D9-12','D9-13'}
for x in r:
    if x['ID'] in missing:
        print('%-9s|%s|agent=%s|OS=%s|term=%s|%s' % (x['ID'], x['优先级'], x.get('agent'), x.get('OS'), x.get('terminal'), x['标题'].strip()[:40]))
        print('     预期:', (x['预期结果'] or '').strip()[:150].replace('\n', ' '))
        print('     前置:', (x['前置条件'] or '').strip()[:100].replace('\n', ' '))