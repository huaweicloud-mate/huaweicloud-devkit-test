import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-27-119.8.181.45\Windows'

with open(base + '\\用例矩阵-设计级.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
for row in rows:
    if (row.get('优先级') or '').strip() == 'P0':
        print('===ID:', row.get('ID'))
        for k in ['维度','标题','优先级','终端覆盖类型','terminal','OS','agent','展开规则','前置条件','操作步骤','预期结果','requiredEvidence','依赖','mission','missionPriority']:
            v = row.get(k)
            if v:
                print('  %s: %s' % (k, v[:150]))
        print()