import csv, os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows'
targets = ['D4-27','D8-4','D9-2','D9-9','D4-2','D4-28','D9-12','D1-66','D9-4','D9-5','D3-S4','D8-9','D8-10','D9-10','D9-11','D9-12','D9-13']
rows = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'),encoding='utf-8-sig')))
byid = {r['ID']: r for r in rows}
for t in targets:
    r = byid.get(t)
    if not r: continue
    print('==== %s [%s/%s] %s ====' % (t, r.get('优先级'), r.get('执行状态'), r.get('标题')))
    print('  预期: %s' % r.get('预期结果'))
    print('  步骤: %s' % r.get('操作步骤'))
    print('  数据: %s' % r.get('测试数据'))
    print('  关联工具: %s' % r.get('关联工具'))
    print()