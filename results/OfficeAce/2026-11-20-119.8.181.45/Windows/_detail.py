# -*- coding: utf-8 -*-
import csv, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.reader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
hdr = rows[0]
iId, iPri, iDim, iTitle = hdr.index('ID'), hdr.index('优先级'), hdr.index('维度'), hdr.index('标题')
for r in rows[1:]:
    if r[iId] in ('D4-1','D4-2','D4-4','D4-5','D4-7','D4-15','D4-16','D4-25','D4-27',
                  'D1-39','D1-40','D2-11','D4-18','D4-19','D2-4','D4-3','D4-9','D4-21','D4-22','D4-23','D4-28','D8-7','D9-12','D9-13','D10-4'):
        print('=====', r[iId], r[iPri], r[iTitle])
        print('前置:', r[hdr.index('前置条件')])
        print('测试数据:', r[hdr.index('测试数据')])
        print('步骤:', r[hdr.index('操作步骤')])
        print('预期:', r[hdr.index('预期结果')])
        print('关联工具:', r[hdr.index('关联工具')])
        print('自动化建议:', r[hdr.index('自动化建议')])
        print('requiredEvidence:', r[hdr.index('requiredEvidence')])
