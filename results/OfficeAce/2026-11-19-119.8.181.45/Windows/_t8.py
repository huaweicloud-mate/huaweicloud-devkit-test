# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
t = open('_t2.txt', encoding='utf-8', errors='replace').read()
seg = t[t.find('===== 设计级按优先级统计'):]
print(seg[12000:])
