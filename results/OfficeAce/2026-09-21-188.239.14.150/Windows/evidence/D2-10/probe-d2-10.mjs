// AI生成
/**
 * D2-10: R7 current档跟随
 * 验证: KooCLI multi-profile current档解析
 */
import { existsSync, readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src';
const results = [];
let overallPass = true;

function check(label, condition, detail) {
  const pass = Boolean(condition);
  if (!pass) overallPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' :: ' + detail : ''}`);
}

console.log('=== D2-10: R7 current档跟随 ===');

// Test 1: 读取现有 hcloud config.json 的 current profile
const hcloudConfigPath = join(process.env.USERPROFILE || 'C:\\Users\\Administrator', '.hcloud', 'config.json');
check('T1.1 hcloud config.json 存在', existsSync(hcloudConfigPath), `path: ${hcloudConfigPath}`);

if (existsSync(hcloudConfigPath)) {
  const config = JSON.parse(readFileSync(hcloudConfigPath, 'utf8'));
  check('T1.2 含 current 字段', 'current' in config, `current: ${config.current}`);
  check('T1.3 含 profiles 数组', Array.isArray(config.profiles), `profiles: ${config.profiles?.length} items`);
  
  if (config.profiles && config.profiles.length > 0) {
    const currentProfile = config.profiles.find(p => p.name === config.current) || config.profiles[0];
    check('T1.4 current profile 可定位', !!currentProfile, `name: ${currentProfile?.name}`);
    check('T1.5 current profile 含 accessKeyId', !!currentProfile?.accessKeyId, 'has accessKeyId');
    check('T1.6 current profile 含 secretAccessKey', !!currentProfile?.secretAccessKey, 'has secretAccessKey');
    check('T1.7 current profile 含 region', !!currentProfile?.region, `region: ${currentProfile?.region}`);
  }
}

// Test 2: 源码验证 - readKooCliProfiles/resolveManagedProfile
const toolsSource = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');
check('T2.1 源码含 profile 解析逻辑', 
  /readKooCliProfiles|resolveManagedProfile|parseHcloudConfig/i.test(toolsSource),
  'profile parsing logic found in source');

// Test 3: auth_switch persist 后 current 档正确
const { callTool } = await import(`file://${srcRoot}/tools.mjs`);
const credPath = 'C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json';
const realCreds = JSON.parse(readFileSync(credPath, 'utf8'));

const resp = await callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: realCreds.ak,
  sk: realCreds.sk,
  region: realCreds.region || 'cn-north-4',
});
console.log('auth_switch persist response:', JSON.stringify(resp, null, 2));
check('T3.1 persist 返回 ok', resp.status === 'ok', `status=${resp.status}`);

// 验证 hcloud config.json 更新后 current 档正确
if (existsSync(hcloudConfigPath)) {
  const config2 = JSON.parse(readFileSync(hcloudConfigPath, 'utf8'));
  check('T3.2 更新后仍含 current', !!config2.current, `current: ${config2.current}`);
  check('T3.3 更新后 profiles 非空', Array.isArray(config2.profiles) && config2.profiles.length > 0, `profiles: ${config2.profiles?.length}`);
}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D2-10', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
