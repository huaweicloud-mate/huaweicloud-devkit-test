# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
t = io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\eval\README.md', encoding='utf-8').read()
i = t.find('## 执行方式')
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_eval_readme_tail.txt', 'w', encoding='utf-8').write(t[i:])
print('ok')
