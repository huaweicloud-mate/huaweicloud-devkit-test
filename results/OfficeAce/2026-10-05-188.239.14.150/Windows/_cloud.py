# -*- coding: utf-8 -*-
import csv, io
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-05-188.239.14.150\Windows'
design = list(csv.DictReader(open(base+'\\用例矩阵-设计级.csv', encoding='utf-8-sig')))
exp = list(csv.DictReader(open(base+'\\用例矩阵-展开级.csv', encoding='utf-8-sig')))
kw = ['真云','建删','ECS','OBS','VPC','审计','管控面','AK/SK','AK','SK','凭证','EIP','子网','安全组','region','Region','资源','云端','建资源','删资源','create','delete']
out = io.open(base+'\\_cloud.txt','w',encoding='utf-8')
out.write('===== DESIGN 命中云/资源关键词 =====\n')
for x in design:
    blob = (x.get('标题') or '') + (x.get('操作步骤') or '') + (x.get('预期结果') or '') + (x.get('requiredEvidence') or '') + (x.get('测试数据') or '')
    hits = [k for k in kw if k in blob]
    if hits:
        out.write('%s P=%s hits=%s | %s\n' % (x['ID'], x['优先级'], hits, x['标题']))
out.write('\n===== EXPAND 命中云/资源关键词 =====\n')
for x in exp:
    blob = (x.get('展开类型') or '') + (x.get('执行要点') or '') + (x.get('预期结果') or '') + (x.get('requiredEvidence') or '')
    hits = [k for k in kw if k in blob]
    if hits:
        out.write('%s P=%s hits=%s | %s (src=%s)\n' % (x['ID'], x['优先级'], hits, x['展开类型'], x['源用例']))
out.close()
print('done')