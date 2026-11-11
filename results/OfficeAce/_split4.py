# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
t = io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_prev_ev2.txt', encoding='utf-8').read()
i = t.find('==== D2-11')
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_prev_ev2b.txt','w',encoding='utf-8').write(t[i:])
print('ok')
