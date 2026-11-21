import io, os
base = os.path.dirname(os.path.abspath(__file__))
t = io.open(os.path.join(base, '_caselist.txt'), encoding='utf-8').read()
marker = 'D4-13 |'
idx = t.find(marker)
io.open(os.path.join(base, '_caselist_rest.txt'), 'w', encoding='utf-8').write(t[idx:])
print('ok', idx)
