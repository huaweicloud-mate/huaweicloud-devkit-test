# -*- coding: utf-8 -*-
import io, os
base = os.path.dirname(os.path.abspath(__file__))
t = io.open(os.path.join(base, 'inspect3_out.txt'), encoding='utf-8').read()
i = t.find('EXP-C4-06')
j = t.find('EXP-E11')
out = io.open(os.path.join(base, 'inspect4_out.txt'), 'w', encoding='utf-8')
out.write(t[i:j])
out.close()
print('ok', i, j)
