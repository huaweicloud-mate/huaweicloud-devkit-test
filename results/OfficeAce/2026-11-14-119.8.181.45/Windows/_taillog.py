# -*- coding: utf-8 -*-
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
lines = open(r'C:\Users\Administrator\devkit-test\OfficeAce\hourly_sync.log', encoding='utf-8', errors='replace').read().splitlines()
print('total lines:', len(lines))
for l in lines[-12:]:
    print(l)
