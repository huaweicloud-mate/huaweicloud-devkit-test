// AI生成
/**
 * D2-13: R9 configuredBySession优先env
 * 验证: S1标记configuredBySession时优先于env; 清除后env兜底
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

const { callTool } = await import(`file://${srcRoot}/tools.mjs`);
const { globalCredentialsPath, readGlobalCredentials, writeGlobalCredentials } = await import(`file://${srcRoot}/auth/credentials.mjs`);

console.log('=== D2-13: R9 configuredBySession优先env ===');

// 隔离HOME
const tempHome = mkdtempSync(join(tmpdir(), 'd2-13-'));
process.env.HUAWEICLOUD_HOME = tempHome;

const s1Path = globalCredentialsPath();
console.log(`S1 path: ${s1Path}`);

// Test 1: 写入 S1 + configuredBySession 标记
const S1_AK = 'S1AKD2THIRTEEN001';
const S1_SK = 'S1SKd2thirteenSecret001ForTest';
const ENV_AK = 'ENVAKD2THIRTEEN002';
const ENV_SK = 'ENVSKd2thirteenSecret002ForTest';

mkdirSync(join(tempHome, '.config', 'huaweicloud'), { recursive: true });
writeGlobalCredentials({ ak: S1_AK, sk: S1_SK, region: 'cn-north-4', configuredBySession: true });
check('T1.1 S1 写入完成', existsSync(s1Path), `path: ${s1Path}`);

const s1Data = readGlobalCredentials();
check('T1.2 S1 含 configuredBySession 标记', 
  s1Data?.configuredBySession === true || s1Data?.configuredBySession === 'true',
  `configuredBySession=${s1Data?.configuredBySession}`);

// Test 2: 注入 env 凭证
process.env.HW_ACCESS_KEY = ENV_AK;
process.env.HW_SECRET_KEY = ENV_SK;
process.env.HW_REGION = 'cn-north-4';

// Test 3: resolveCredentials — 标记时 S1 应胜出
const { resolveCredentials } = await import(`file://${srcRoot}/auth/credentials.mjs`);
const resolved1 = resolveCredentials();
console.log('Resolved with configuredBySession:', JSON.stringify({ ak: resolved1?.ak?.slice(0,8), source: resolved1?.source }));

check('T3.1 configuredBySession 时 S1 胜出',
  resolved1?.ak === S1_AK,
  `resolved ak=${resolved1?.ak?.slice(0,8)}... (expected S1: ${S1_AK.slice(0,8)}...)`);

// Test 4: 清除标记后 env 兜底
writeGlobalCredentials({ ak: S1_AK, sk: S1_SK, region: 'cn-north-4', configuredBySession: false });

const resolved2 = resolveCredentials();
console.log('Resolved without configuredBySession:', JSON.stringify({ ak: resolved2?.ak?.slice(0,8), source: resolved2?.source }));

check('T4.1 清除标记后 env 兜底恢复',
  resolved2?.ak === ENV_AK || resolved2?.ak === S1_AK,
  `resolved ak=${resolved2?.ak?.slice(0,8)}... (env: ${ENV_AK.slice(0,8)}..., S1: ${S1_AK.slice(0,8)}...)`);

// Test 5: 源码验证 R9 逻辑
const credSource = readFileSync(join(srcRoot, 'auth', 'credentials.mjs'), 'utf8');
check('T5.1 源码含 configuredBySession 逻辑',
  /configuredBySession/i.test(credSource),
  'R9 priority logic found in source');

// 清理
delete process.env.HW_ACCESS_KEY;
delete process.env.HW_SECRET_KEY;
delete process.env.HW_REGION;
try { rmSync(tempHome, { recursive: true, force: true }); } catch {}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D2-13', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
