import csv, sys, json
sys.stdout.reconfigure(encoding='utf-8')
import os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-24-188.239.14.150\Windows'
rows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
ids = ['D8-7','D9-12','D9-13','D4-18','D4-19','D4-23','D4-28','D4-2','D4-16','D2-4']
for r in rows:
    if r['ID'] in ids:
        print('#####', r['ID'], r['标题'], '| P', r['优先级'])
        print('  前置:', (r.get('前置条件') or '').replace('\n',' ')[:150])
        print('  步骤:', (r.get('操作步骤') or '').replace('\n',' | ')[:300])
        print('  预期:', (r.get('预期结果') or '').replace('\n',' | ')[:300])
        print('  证据:', r.get('requiredEvidence',''))
        print()