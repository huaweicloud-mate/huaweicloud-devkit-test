// #616 端到端回归验证（产品 getCredentials 链 + test env）
import { getCredentials } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/sandbox/hwlink-api.mjs';

const URL = 'http://devkit.topxtopx.com/rest/developer/server/hdkitservice/check-user';
let ak, sk, tok;
try {
  const c = getCredentials();
  ak = c.ak; sk = c.sk; tok = c.securityToken;
  console.log('CRED_OK ak_prefix=' + String(ak).slice(0, 4));
} catch (e) {
  console.log('CRED_FAIL ' + e.message);
  process.exit(2);
}

async function call(label, extra) {
  const headers = { 'Content-Type': 'application/json', 'X-HW-AK': ak, 'X-HW-SK': sk };
  if (tok) headers['X-HW-Security-Token'] = tok;
  if (extra) Object.assign(headers, extra);
  try {
    const resp = await fetch(URL, { method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(15000) });
    const text = await resp.text();
    console.log('[' + label + '] HTTP ' + resp.status);
    console.log('  ' + text.slice(0, 400));
    return { s: resp.status, b: text };
  } catch (e) {
    console.log('[' + label + '] ERR ' + e.message);
    return { s: -1, b: String(e) };
  }
}

const a = await call('A 无版本header');
const b = await call('B X-HW-Client-Version=1.1.1', { 'X-HW-Client-Version': '1.1.1' });
const tooA = a.b.includes('HDKIT_VERSION_TOO_OLD');
const tooB = b.b.includes('HDKIT_VERSION_TOO_OLD');
console.log('---判定---');
console.log('A 版本拦截: ' + tooA);
console.log('B 版本拦截: ' + tooB);
if (tooA) console.log('[结论A] 无版本 header 仍被拦截 → main 旧形态未被客户端侧恢复（需发带 header 版本）');
else console.log('[结论A] 无版本 header 未被拦截 → 测试环境 min 门槛关闭生效（旧客户端不再被硬拦截）');
if (tooB) console.log('[结论B] 带版本 header 仍被拦截 → dev 修复形态无效/契约不符');
else console.log('[结论B] 带版本 header 未被拦截 → X-HW-Client-Version 契约生效，dev 修复形态通过');