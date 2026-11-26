import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
d = json.load(open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows\evidence\_batch_summary.json', encoding='utf-8'))
print(d['total'], 'pass=', d['pass'], 'fail=', d['fail'], 'blocked=', d['blocked'])
from collections import Counter
c = Counter()
for r in d['results']:
    c[r['status']] += 1
print(dict(c))
fails = [r['caseId'] for r in d['results'] if r['status'] != 'PASS']
print('nonpass:', ','.join(fails))
