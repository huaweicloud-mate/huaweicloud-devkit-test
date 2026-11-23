import io, os

base = os.path.dirname(os.path.abspath(__file__))
s = io.open(os.path.join(base, '_compact.txt'), encoding='utf-8').read()
i = s.find('EXP-C4-11')
io.open(os.path.join(base, '_compact3.txt'), 'w', encoding='utf-8').write(s[i:])
print('ok')
