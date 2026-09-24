import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base_ref = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-22-188.239.14.150\Windows'
rows = list(csv.DictReader(open(base_ref + r'\用例矩阵-设计级.csv', encoding='utf-8-sig')))
for r in rows:
    if r['优先级'] == 'P0':
        print(r['ID'], '|', r['执行状态'], '|', r['evidencePath'], '|', r['blockedReason'].replace('\n',' ')[:60])