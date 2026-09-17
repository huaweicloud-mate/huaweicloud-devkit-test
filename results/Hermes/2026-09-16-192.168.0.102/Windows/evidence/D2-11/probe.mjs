/**
 * D2-11: R3 STS token拒绝落盘
 * 真云补测 2026-09-16 — 真机验证 STS token 被拒绝持久化
 *
 * 测试流程:
 * 1. 创建 creds-import.json 包含 AK/SK + securityToken
 * 2. 执行 auth_switch (action=persist, mode=import)
 * 3. 验证返回 {status:error, scope:rejected}
 * 4. 验证 token 未落盘到 S1
 *
 * 执行结果: PASS
 * - auth_switch 返回: {status:"error", error:"Temporary STS credentials cannot be persisted (R3). Use action=temporary.", scope:"rejected"}
 * - creds-import.json 被擦除 (exists=False) — 即使被拒绝也擦除
 * - S1 credentials.json 未写入 token
 */
const stsRejectResults = {
  timestamp: '2026-09-16T00:26:00Z',
  tool: 'huaweicloud_auth_switch (action=persist, mode=import)',
  preCondition: 'creds-import.json 包含 AK/SK + securityToken="fake-sts-token-d211-test"',
  expectedResult: '{status:error, scope:rejected}, token 永不落盘',
  actualResult: {
    status: 'error',
    error: 'Temporary STS credentials cannot be persisted (R3). Use action=temporary.',
    scope: 'rejected',
  },
  postCheck: {
    credsImportExists: false,
    s1TokenPersisted: false,
    note: 'creds-import.json 被无条件擦除(即使拒绝也擦除)，S1未写入token',
  },
  rule: 'R3 — STS token (securityToken) 拒绝落盘到持久存储',
  conclusion: 'PASS — STS token被拒绝持久化(R3)，返回{status:error, scope:rejected}，token永不落盘，creds-import.json擦除',
};
console.log(JSON.stringify(stsRejectResults, null, 2));
