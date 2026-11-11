# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\eval\harness\fixtures\README.md'
t = io.open(p, encoding='utf-8').read()
print(len(t))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_fixtures_readme.txt', 'w', encoding='utf-8').write(t[:6000])
print('ok')
