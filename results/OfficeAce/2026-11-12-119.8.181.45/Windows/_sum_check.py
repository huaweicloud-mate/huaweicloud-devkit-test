# -*- coding: utf-8 -*-
import sys, json
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows\evidence\_batch_summary.json', encoding='utf-8'))
print('total', len(d['results']))
from collections import Counter
print(Counter(r['status'] for r in d['results']))
for r in d['results']:
    if r['status'] != 'PASS':
        print(r['caseId'], r['status'], r['why'][:120])
