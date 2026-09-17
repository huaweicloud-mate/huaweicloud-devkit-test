// 补充探针：认证域假阻塞用例直调回填（D2-2 auth status 判定准确性）
// 直调 hdk 源码 auth/service.mjs getAuthStatus / computeOnboarding，本机 hermetic 构造部分组合。
import { getAuthStatus, computeOnboarding } from '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src/auth/service.mjs';
import { getAgentRegistrationStatuses } from '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src/auth/agent-registration.mjs';
import { readGlobalCredentials } from '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';

let PASS = 0, FAIL = 0;
function assert(label, cond, detail = '') {
  const ok = Boolean(cond);
  if (ok) PASS++; else FAIL++;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' | ' + detail : ''}`);
}
console.log('=====CASE D2-2=====');

// 真实本机态：管理员凭证已预置 → credentialsConfigured 应为 true
const cred = readGlobalCredentials();
console.log('readGlobalCredentials 是否含 AK/SK:', Boolean(cred && cred.ak && cred.sk));
const st = getAuthStatus('all');
console.log('getAuthStatus(all):', JSON.stringify(st, null, 2).slice(0, 1200));

const flat = JSON.stringify(st);
assert('D2-2: 返回含 credentialsConfigured 字段', /credentialsConfigured/.test(flat));
assert('D2-2: 返回含 kooCliInstalled 或等价字段', /kooCliInstalled|koocli|cliInstalled/i.test(flat));
assert('D2-2: 本机管理员凭证预置 → credentialsConfigured=true', st.credentialsConfigured === true, `credentialsConfigured=${st.credentialsConfigured}`);

// 源码级：computeOnboarding 对 未配置/已配置 的纯函数判定（hermetic，无需真云）
const onbNone = computeOnboarding({ credentials: { ak: '' }, reconciled: { configured: false } });
const onbReady = computeOnboarding({ credentials: { ak: 'AK', sk: 'SK' }, reconciled: { configured: true } });
console.log('computeOnboarding(未配置):', JSON.stringify(onbNone));
console.log('computeOnboarding(已配置):', JSON.stringify(onbReady));
assert('D2-2: 未配置态 onboarding 给出 setup 引导', /setup|onboard|configure|needs/i.test(JSON.stringify(onbNone)));
assert('D2-2: 已配置态 onboarding 无 setup 引导', !/setup|needs/i.test(JSON.stringify(onbReady)));

console.log('D2-2 说明: 三端×就绪/未就绪 8 组合的「KooCLI 未安装态」本机无法 hermetic 构造（本机 hcloud 已装且管理员凭证预置）；已实测本机真实态 + computeOnboarding 纯函数两极组合。');
console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL ? 1 : 0);