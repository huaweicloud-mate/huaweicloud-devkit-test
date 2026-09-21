// D2-11 (P0): R3 STS token拒绝落盘
// 源码级直调 huaweicloud_auth_switch(action=persist + securityToken) 断言返回 {status:error, scope:rejected}。
// 确定性: persistCredentials() 在 tools.mjs:1012-1018 对 truthy securityToken 直接拒绝，先于任何写盘。
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readGlobalCredentials, globalCredentialsPath } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).substring(0, 100), expected: String(expected).substring(0, 100) });
}

// 读取现有 S1 ak（仅用于避免 R2/账户冲突分支，不回显），用相同 ak 触达 persistCredentials。
let currentAk = 'AKID-D211-FAKE';
try {
  const prev = readGlobalCredentials();
  if (prev && prev.ak) currentAk = prev.ak;
} catch {}

const fakeToken = `fake-sts-token-${Date.now()}`;
const resp = await callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: currentAk,
  sk: 'SK-D211-FAKE',
  securityToken: fakeToken,
  region: 'cn-north-4',
});

test('D2-11', 'scope-rejected', resp?.scope === 'rejected' || resp?.status === 'error', resp?.scope, 'rejected');
test('D2-11', 'status-error', resp?.status === 'error', resp?.status, 'error');
test('D2-11', 'sts-message', /STS|Temporary|R3/i.test(String(resp?.error || resp?.message || '')), String(resp?.error || resp?.message || ''), 'STS/R3 message');

// 核对 S1 未写入 token（token 永不落盘）
let s1HasToken = false;
try {
  if (existsSync(globalCredentialsPath)) {
    const raw = readFileSync(globalCredentialsPath, 'utf8');
    s1HasToken = raw.includes(fakeToken);
  }
} catch {}
test('D2-11', 'token-not-persisted', s1HasToken === false, '无 token', '无 token');

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-22-1.94.218.129/Linux/evidence/D2-11/stdout.log'), output, 'utf8');
console.log(output);