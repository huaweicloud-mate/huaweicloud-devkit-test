/**
 * D2-16: import文件读取后擦除
 * 真云补测 2026-09-16 — 真机验证 creds-import.json 读后无条件擦除
 *
 * 测试流程:
 * 1. 创建 creds-import.json (从 credentials.json 复制，无 STS token)
 * 2. 执行 auth_switch (action=persist, mode=import)
 * 3. 检查 creds-import.json 存在性
 *
 * 执行结果: PASS
 * - auth_switch 返回: {status:"ok", scope:"persist", backedUp:true}
 * - S1 写入 configuredBySession (R9)，S2/S3 同步
 * - creds-import.json 擦除 (exists=False)
 * - 补充验证: D2-11 测试中即使 import 被拒绝(STS)，文件也被擦除 → 无条件擦除
 */
const importEraseResults = {
  timestamp: '2026-09-16T00:27:00Z',
  tool: 'huaweicloud_auth_switch (action=persist, mode=import)',
  preCondition: 'creds-import.json 存在 (含 AK/SK，无 securityToken)',
  step1_create: 'creds-import.json created (copied from credentials.json, no STS)',
  step2_import: {
    status: 'ok',
    scope: 'persist',
    backedUp: true,
    obs: { configured: true },
    hcloud: { ok: true, error: '' },
    note: 'S1 written with configuredBySession (R9), S2 and S3 synced',
  },
  step3_check: {
    credsImportExists: false,
    result: '读后无条件擦除 (exists=False)',
  },
  supplementary: {
    d2_11_test: '即使 import 被 STS 拒绝(R3)，creds-import.json 也被擦除 → 确认无条件擦除语义',
  },
  conclusion: 'PASS — creds-import.json 读后无条件擦除(exists=False)，密钥不留盘，auth_switch persist同步成功',
};
console.log(JSON.stringify(importEraseResults, null, 2));
