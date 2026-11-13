# -*- coding: utf-8 -*-
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
src = open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\hourly_sync.py', encoding='utf-8').read()
print('LEN', len(src))
print(src[:3500])
