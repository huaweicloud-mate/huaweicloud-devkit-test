# -*- coding: utf-8 -*-
import csv, io
e = list(csv.DictReader(io.open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
d = list(csv.DictReader(io.open('用例矩阵-设计级.csv', encoding='utf-8-sig')))

def get(x, *keys):
    for k in keys:
        if k in x and x[k]:
            return x[k].strip()
    return ''

def show(rows, ids, title_key):
    for x in rows:
        if x['ID'] in ids:
            print('=' * 70)
            print(x['ID'], '|', get(x, '优先级'), '|', get(x, title_key))
            print('  预期:', get(x, '预期结果')[:500].replace('\n', ' '))
            print('  步骤:', get(x, '操作步骤', '执行要点')[:400].replace('\n', ' '))
            print('  前置:', get(x, '前置条件')[:200].replace('\n', ' '))
            print('  terminal:', get(x, 'terminal'), '| agent:', get(x, 'agent'))

print('########## 展开级缺失 ##########')
show(e, ['EXP-D5-7-1', 'EXP-D5-7-3'], '标题')
print('########## 设计级 P0 缺失 ##########')
show(d, ['D9-12', 'D9-13'], '标题')