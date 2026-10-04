import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const auth = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/auth/credentials.mjs');
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
let status = 'PASS', why = '', evidence = {};
// 备份现有凭证
const credPath = auth.globalCredentialsPath();
const backup = existsSync(credPath) ? readFileSync(credPath, 'utf8') : null;
try {
  // 用与现有不同的 AK 触发 conflict → confirm → persistCredentials(sts) → R3 拒绝
  // 但更直接：用相同 AK（无 conflict）直走 persistCredentials(sts) → R3 拒绝
  const existing = auth.readGlobalCredentials();
  const r = await tools.callTool('huaweicloud_auth_switch', {
    action: 'persist',
    ak: existing.ak,  // 同 AK，无 conflict
    sk: existing.sk,
    securityToken: 'STS_TOKEN_R3_TEST',
    region: existing.region || 'cn-north-4',
  });
  evidence.authSwitchResult = r;
  const body = JSON.stringify(r);
  const rejected = body.includes('rejected') && body.includes('R3');
  // 核对 token 未落盘
  const after = auth.readGlobalCredentials();
  const tokenPersisted = after && String(after.securityToken || '').includes('STS_TOKEN_R3_TEST');
  if (rejected && !tokenPersisted) {
    status = 'PASS'; why = 'auth_switch persist+STS 返回 scope=rejected (R3)，token 未落盘 credentials.json';
  } else {
    status = 'FAIL'; why = 'STS token 未被 R3 拒绝：result=' + body.slice(0,300) + ' tokenPersisted=' + tokenPersisted;
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
} finally {
  // 恢复
  if (backup !== null) writeFileSync(credPath, backup);
}
const result = { caseId: 'D2-11', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
