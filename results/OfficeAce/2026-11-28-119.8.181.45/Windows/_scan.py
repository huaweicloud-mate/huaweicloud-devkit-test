# -*- coding: utf-8 -*-
import sys, csv, os, re
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-28-119.8.181.45\Windows'
# check src modules exist
src = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src'
mods = ['safety-policy.mjs','update-check.mjs','tools.mjs','mcp-protocol.mjs','detect-framework.mjs','risk-rule-engine.mjs','preflight.mjs','icon-library.mjs','koocli-version.mjs','mcp-config-backup.mjs','mcp-config-merge.mjs','setup-cli.mjs','auth/credentials.mjs','auth/guidance.mjs','auth/service.mjs','sandbox/session-manager.mjs','proxy/proxy-config.mjs','hcloud-cli.mjs','mcp-server.mjs']
missing = [m for m in mods if not os.path.exists(os.path.join(src, m))]
print('missing src modules:', missing)
print('mcp helper exists:', os.path.exists(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_officeace_mcp_helper.mjs'))
# scan design csv for creation/deletion keywords
kw = re.compile(r'创建|删除|开通|申请|购买|回收|清理|退订')
for fn in ['用例矩阵-设计级.csv']:
    rows = list(csv.DictReader(open(os.path.join(base, fn), encoding='utf-8-sig')))
    print('---', fn, len(rows), 'rows')
    for r in rows:
        text = (r.get('操作步骤','') + ' ' + r.get('执行要点','') + ' ' + r.get('预期结果',''))
        hits = kw.findall(text)
        if hits:
            print(r.get('ID'), r.get('优先级'), '|', ' '.join(set(hits)), '|', text.replace('\n',' ')[:120])
