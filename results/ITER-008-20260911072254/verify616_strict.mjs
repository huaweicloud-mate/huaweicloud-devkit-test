// #616 严格对照 E2E —— 精确控制 header 差异（真实凭据链 + 显式 header 构造）
// A: 裸 headers（Content-Type/X-HW-AK/X-HW-SK，无版本）—— 模拟"未修复"客户端形态
// B: + X-HW-Client-Version（产品契约 header）—— 模拟 dev/main 现有形态
// 用产品 getCredentials 取凭据（仅内存），fetch 显式构造两种 headers
import { getCredentials } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/sandbox/hwlink-api.mjs';

const URL = 'http://devkit.topxtopx.com/rest/developer/server/hdkitservice/check-user';
const c = getCredentials();
console.log('CRED_OK prefix=' + String(c.ak).slice(0, 4));

async function call(label, withVersion) {
  const headers = { 'Content-Type': 'application/json', 'X-HW-AK': c.ak, 'X-HW-SK': c.sk };
  if (c.securityToken) headers['X-HW-Security-Token'] = c.securityToken;
  if (withVersion) headers['X-HW-Client-Version'] = '1.1.3-next.2';
  try {
    const resp = await fetch(URL, { method: 'GET', headers, signal: AbortSignal.timeout(20000) });
    const text = await resp.text();
    console.log(`[${label}] HTTP ${resp.status}`);
    console.log('  ' + text.slice(0, 350));
    return { s: resp.status, b: text };
  } catch (e) {
    console.log(`[${label}] ERR ${e.message.slice(0, 200)}`);
    return { s: -1, b: String(e.message || '') };
  }
}

console.log('\n=== 试验 A: 无版本 header（未修复形态）===');
const a = await call('A 无版本', false);
console.log('\n=== 试验 B: 带 X-HW-Client-Version（产品现有形态）===');
const b = await call('B 带版本', true);

const tooA = a.b.includes('HDKIT_VERSION_TOO_OLD');
const tooB = b.b.includes('HDKIT_VERSION_TOO_OLD');
console.log('\n=== 判定 ===');
console.log(`A(无版本) 被版本拦截: ${tooA}`);
console.log(`B(带版本) 被版本拦截: ${tooB}`);
if (!tooA) console.log('[结论A] 无版本 header 不再被拦截 → 测试环境 min 门槛关闭生效（旧客户端形态已恢复）');
else console.log('[结论A] 无版本 header 仍被拦截 → 旧客户端形态仍受版本门槛限制');
if (!tooB) console.log('[结论B] 带版本 header 未被拦截 → 版本契约 header 通过');
else console.log('[结论B] 带版本 header 仍被拦截 → 契约 header 无效');