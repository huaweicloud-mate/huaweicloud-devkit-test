# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
t = open('_cases.txt', encoding='utf-8').read()
i = t.find('== 用例矩阵-展开级')
open('_cases_p1.txt', 'w', encoding='utf-8').write(t[:i])
open('_cases_p2.txt', 'w', encoding='utf-8').write(t[i:])
print('split ok', i)
