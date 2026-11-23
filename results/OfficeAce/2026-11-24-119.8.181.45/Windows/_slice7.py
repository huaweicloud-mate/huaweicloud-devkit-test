# -*- coding: utf-8 -*-
import io, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = io.open('_exp_full.txt', encoding='utf-8').read()
i = s.find('=== EXP-E14')
io.open('_e4.txt', 'w', encoding='utf-8').write(s[i:])
print('wrote _e4.txt from', i)
