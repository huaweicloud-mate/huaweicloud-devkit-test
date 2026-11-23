# -*- coding: utf-8 -*-
import io, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = io.open('_exp_full.txt', encoding='utf-8').read()
i = s.find('=== EXP-E02')
io.open('_e2.txt', 'w', encoding='utf-8').write(s[i:])
print('wrote _e2.txt from', i)
