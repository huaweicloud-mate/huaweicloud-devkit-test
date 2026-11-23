# -*- coding: utf-8 -*-
import io, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = io.open('_design_full.txt', encoding='utf-8').read()
i = s.find('=== D10-3')
io.open('_d8.txt', 'w', encoding='utf-8').write(s[i:])
print('wrote _d8.txt from', i)
