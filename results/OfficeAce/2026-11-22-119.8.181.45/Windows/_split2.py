import io, os
base = os.path.dirname(os.path.abspath(__file__))
t = io.open(os.path.join(base, '_caselist.txt'), encoding='utf-8').read()
i = t.find('EXP-C4-14')
res = t[i:] if i >= 0 else 'NOT FOUND EXP-C4-14'
with io.open(os.path.join(base, '_exp_rest.txt'), 'w', encoding='utf-8') as f:
    f.write(res)
print('idx', i, 'len', len(res))
