// AI生成
/**
 * D2-1: auth init三端同步
 * 验证: hcloud CLI凭证配置 + OBS配置 + 沙箱配置 三端落位
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

// 隔离HOME
const tempHome = mkdtempSync(join(tmpdir(), 'd2-1-'));
process.env.HUAWEICLOUD_HOME = tempHome;

// 读取真实凭证(不输出)
const credPath = 'C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json';
const realCreds = JSON.parse(readFileSync(credPath, 'utf8'));

console.log('=== D2-1: auth init三端同步 ===');

// 加载模块
const { callTool } = await import(`file://${srcRoot}/tools.mjs`);
const { globalCredentialsPath, readGlobalCredentials } = await import(`file://${srcRoot}/auth/credentials.mjs`);

// 执行 auth_switch persist (写入三端)
const resp = await callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: realCreds.ak,
  sk: realCreds.sk,
  region: realCreds.region || 'cn-north-4',
});

console.log('auth_switch persist response:', JSON.stringify(resp, null, 2));
check('auth_switch persist 返回 ok', resp.status === 'ok', `status=${resp.status}`);

// S1: credentials.json
const s1Path = globalCredentialsPath();
check('S1 credentials.json 落位', existsSync(s1Path), `path: ${s1Path}`);

if (existsSync(s1Path)) {
  const s1 = JSON.parse(readFileSync(s1Path, 'utf8'));
  check('S1 含 ak', !!s1.ak, `ak prefix: ${s1.ak?.slice(0,6)}...`);
  check('S1 含 sk', !!s1.sk, `sk length: ${s1.sk?.length}`);
  check('S1 含 region', !!s1.region, `region: ${s1.region}`);
  check('S1 ak 与输入一致', s1.ak === realCreds.ak, '凭证正确写入');
  check('S1 sk 与输入一致', s1.sk === realCreds.sk, '密钥正确写入');
}

// S2: hcloud config.json (written by hcloud CLI to real HOME)
const realHome = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Administrator';
const s2Path = join(realHome, '.hcloud', 'config.json');
check('S2 hcloud config.json 落位', existsSync(s2Path), `path: ${s2Path}`);
check('S2 hcloud sync 报告 ok', resp.hcloud?.ok === true, `hcloud.ok=${resp.hcloud?.ok}`);

if (existsSync(s2Path)) {
  try {
    const s2 = JSON.parse(readFileSync(s2Path, 'utf8'));
    check('S2 含 current profile', !!s2.current, `current: ${s2.current}`);
    check('S2 含 profiles 数组', Array.isArray(s2.profiles) && s2.profiles.length > 0, `profiles count: ${s2.profiles?.length}`);
  } catch(e) {
    check('S2 config.json 可解析', false, e.message);
  }
}

// S3: obsutil config (written by obsutil to real HOME)
const s3Path = join(realHome, '.obsutilconfig');
check('S3 obsutil config 落位', existsSync(s3Path), `path: ${s3Path}`);
check('S3 OBS sync 报告 configured', resp.obs?.configured === true, `obs.configured=${resp.obs?.configured}`);

// 清理
try { rmSync(tempHome, { recursive: true, force: true }); } catch {}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({
  testCase: 'D2-1',
  title: 'auth init三端同步',
  result: overallPass ? 'PASS' : 'FAIL',
  checks: results,
  timestamp: new Date().toISOString(),
}));
process.exit(overallPass ? 0 : 1);
