# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
t = io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_alldesign.txt', encoding='utf-8').read()
lines = t.splitlines()
i = 0
buf = io.StringIO()
for l in lines:
    if l.split('|')[0] in ('D3-C13','D3-C14','D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8','D4-1','D4-2','D4-3','D4-4','D4-5','D4-6','D4-8','D4-12','D4-13','D4-15','D4-21','D4-23','D4-28','D6-4','D6-9','D8-7','D8-9','D8-10','D8-11','D8-12','D9-6','D9-9','D9-10','D9-11','D9-13','D11-1','D11-2','D11-17','D11-18','D11-30','D11-34','D11-38','D11-41','D11-42','D11-43'):
        buf.write(l+'\n')
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_alldesign_b.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
