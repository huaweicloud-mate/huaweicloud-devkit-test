import io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
p = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-01-188.239.14.150/Windows/evidence/EXP-C4-01/probe.mjs'
t = open(p, encoding='utf-8', errors='replace').read()
print('len', len(t))
print("'09-30' in t =>", '09-30' in t)
print("'2026-09-30' in t =>", '2026-09-30' in t)
print("'2026-10-01' count =>", t.count('2026-10-01'))
i = t.find('09-30')
print('find idx', i)
if i >= 0:
    print(repr(t[max(0,i-80):i+80]))