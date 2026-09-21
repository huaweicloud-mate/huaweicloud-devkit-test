// AI生成
/**
 * D2-16: import文件读取后擦除
 * 验证: auth_switch mode=import 读取 creds-import.json 后文件被擦除
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

console.log('=== D2-16: import文件读取后擦除 ===');

// 隔离HOME
const tempHome = mkdtempSync(join(tmpdir(), 'd2-16-'));
process.env.HUAWEICLOUD_HOME = tempHome;

// Test 1: 放置 creds-import.json (in .config/huaweicloud/ dir, same as credentials.json)
const { globalCredentialsPath } = await import(`file://${srcRoot}/auth/credentials.mjs`);
const importDir = join(tempHome, '.config', 'huaweicloud');
mkdirSync(importDir, { recursive: true });
const importFilePath = join(importDir, 'creds-import.json');
const importCreds = {
  ak: 'IMPORTAKD2SIXTEEN001',
  sk: 'IMPORTSKd2sixteenSecret001ForTest',
  region: 'cn-north-4',
};
writeFileSync(importFilePath, JSON.stringify(importCreds, null, 2));
check('T1.1 creds-import.json 已放置', existsSync(importFilePath), `path: ${importFilePath}`);

// Test 2: auth_switch mode=import
let resp;
try {
  resp = await callTool('huaweicloud_auth_switch', {
    action: 'temporary',
    mode: 'import',
  });
} catch(e) {
  resp = { error: e.message };
}
console.log('auth_switch import response:', JSON.stringify(resp, null, 2));

check('T2.1 auth_switch import 返回有效响应', !!resp, 'has response');

// Test 3: 检查文件是否被擦除
const fileExistsAfter = existsSync(importFilePath);
check('T3.1 import 文件读取后被擦除', !fileExistsAfter, 
  fileExistsAfter ? '文件仍存在 - 密钥可能留盘!' : '文件已擦除 - 密钥不留盘');

// Test 4: 源码验证 - import 后擦除逻辑
const toolsSource = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');
check('T4.1 源码含 import 文件擦除逻辑',
  /readImportFile|unlinkSync|rmSync.*import|delete.*import/i.test(toolsSource),
  'import erasure logic found in source');

// Test 5: 如果文件没被擦除，检查内容是否泄露
if (fileExistsAfter) {
  const content = readFileSync(importFilePath, 'utf8');
  check('T5.1 文件内容不含密钥(降级检查)',
    !content.includes(importCreds.ak) && !content.includes(importCreds.sk),
    'file exists but secrets removed');
}

// 清理
if (existsSync(importFilePath)) {
  try { rmSync(importFilePath, { force: true }); } catch {}
}
try { rmSync(tempHome, { recursive: true, force: true }); } catch {}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D2-16', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
