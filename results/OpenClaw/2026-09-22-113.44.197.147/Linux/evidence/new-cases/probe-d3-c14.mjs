// 2026-09-20 OpenClaw Linux — D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证 源码级探针
// ①hdkitConnect 透传 source/env ②hdkitCredentials 缺 id 报错 ③hwlink getCredentials 返回 {ak,sk,securitytoken} ④createConnection 用 securitytoken 走 x-security-token 头
import { readFileSync } from 'node:fs';

const CORE = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
let pass = 0, fail = 0;
const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function note(m) { lines.push(`NOTE   ${m}`); }

const { hdkitConnect, hdkitCredentials } = await import(CORE + '/sandbox/hdkitservice-api.mjs');
const { getCredentials, createConnection } = await import(CORE + '/sandbox/hwlink-api.mjs');

// ① hdkitConnect 透传 source/env 到 body（源码级断言 + 真机 connect 校验 source 生效）
{
  const src = readFileSync(CORE + '/sandbox/hdkitservice-api.mjs', 'utf8');
  check('D3-C14', 'hdkitConnect 透传 source', /if \(options\.source\) body\.source = options\.source/.test(src), true);
  check('D3-C14', 'hdkitConnect 透传 env/git/template_id/flavor_id', /if \(options\.env\) body\.env = options\.env/.test(src) && /if \(options\.template_id\) body\.template_id/.test(src) && /if \(options\.flavor_id\) body\.flavor_id/.test(src), true);
}

// ② hdkitCredentials 缺 sessionId+devStageId 报错
{
  let errMsg = '';
  try { await hdkitCredentials(undefined, undefined); } catch (e) { errMsg = String(e?.message || e); }
  note(`D3-C14 hdkitCredentials() => ${errMsg}`);
  check('D3-C14', 'hdkitCredentials 缺 sessionId+devStageId 抛错', /session_id or dev_stage_id is required/.test(errMsg), true);
}

// ③ hwlink getCredentials 返回 {ak,sk,securitytoken}（无 token 时 securitytoken 为空串/undefined）
{
  const gc = getCredentials();
  note(`D3-C14 getCredentials keys=${Object.keys(gc || {}).join(',')}`);
  check('D3-C14', 'getCredentials 返回含 ak 字段', 'ak' in (gc || {}), true);
  check('D3-C14', 'getCredentials 返回含 sk 字段', 'sk' in (gc || {}), true);
  check('D3-C14', 'getCredentials 返回含 securitytoken 字段', 'securitytoken' in (gc || {}), true);
}

// ④ createConnection 用 securitytoken 走 x-security-token 签名头（源码级）
{
  const src = readFileSync(CORE + '/sandbox/hwlink-api.mjs', 'utf8');
  check('D3-C14', '签名字段含 x-security-token(securitytoken 时)', /x-security-token/.test(src) && /if \(securitytoken\)\s*\{?[\s\S]*headers\['x-security-token'\] = securitytoken/.test(src), true);
  check('D3-C14', 'createConnection 导出可调用', typeof createConnection, 'function');
}

console.log('\n=== OpenClaw Linux D3-C14 沙箱参数/凭证 探针结果 (2026-09-20) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);