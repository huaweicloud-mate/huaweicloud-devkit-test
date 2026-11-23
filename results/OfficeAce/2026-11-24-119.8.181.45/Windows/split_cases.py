import io, os

base = os.path.dirname(os.path.abspath(__file__))
s = io.open(os.path.join(base, '_cases_all.txt'), encoding='utf-8').read()
log = io.open(os.path.join(base, '_split_log.txt'), 'w', encoding='utf-8')
log.write('D1-27 at %d\n' % s.find('--- CASE D1-27'))
log.write('D1-40 at %d\n' % s.find('--- CASE D1-40'))
log.write('D1-60 at %d\n' % s.find('--- CASE D1-60'))
log.write('EXPANDED at %d\n' % s.find('########## EXPANDED'))
log.write('MISSION at %d\n' % s.find('########## MISSION'))
log.write('len %d\n' % len(s))
log.close()
print('ok')
