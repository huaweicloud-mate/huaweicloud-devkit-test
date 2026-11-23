# -*- coding: utf-8 -*-
import io, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = io.open('_design_full.txt', encoding='utf-8').read()
for tag in ['D9-5', 'D9-9', 'D9-10', 'D9-12', 'D10-3', 'D10-4']:
    print(tag, s.find('=== ' + tag))
i = s.find('=== D9-5')
io.open('_d6.txt', 'w', encoding='utf-8').write(s[i:])
print('wrote _d6.txt from', i)
