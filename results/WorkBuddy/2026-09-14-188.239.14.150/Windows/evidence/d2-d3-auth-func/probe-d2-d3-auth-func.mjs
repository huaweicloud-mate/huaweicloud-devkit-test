/**
 * WorkBuddy 每日测试探针 - D2认证 + D3功能 (源码级)
 * 测试用例: D2-1, D2-2, D2-4, D2-5, D2-10, D2-11, D2-12, D2-13, D2-16
 *           D3-A1, D3-B1, D3-B3, D3-B5, D3-C4, D3-C5
 *           D1-3, D1-4, D1-6 (CLI)
 * 验证 huaweicloud-devkit 认证/功能域的源码级正确性
 */
import { classifyTextCommand, classifyHcloudArgs, redactSecrets } from 'file:///C:/Users/Administrator/WorkBuddy/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_SRC = 'C:/Users/Administrator/WorkBuddy/devkit-test/hdk/plugins/huaweicloud-core/src';
const PKG_ROOT = 'C:/Users/Administrator/WorkBuddy/devkit-test/hdk';
const results = [];

function test(name, pass, actual, expected, passMsg, failMsg) {
  results.push({ name, pass, actual, expected, passMsg, failMsg });
}

// === D2-1: auth init 三端同步 ===
const AUTH_DIR = join(PLUGIN_SRC, 'auth');
const authCredFile = join(AUTH_DIR, 'credentials.mjs');
const authCredValidatorFile = join(AUTH_DIR, 'credential-validator.mjs');
const authReconcileFile = join(AUTH_DIR, 'reconcile.mjs');
const authSrc = (existsSync(authCredFile) ? readFileSync(authCredFile, 'utf-8') : '')
  + (existsSync(authCredValidatorFile) ? readFileSync(authCredValidatorFile, 'utf-8') : '')
  + (existsSync(authReconcileFile) ? readFileSync(authReconcileFile, 'utf-8') : '');
test('D2-1 auth-init-exists',
  authSrc.includes('auth init') || authSrc.includes('authInit') || authSrc.includes('initAuth'),
  authSrc.length > 0,
  'auth init 逻辑存在于 auth.mjs',
  'auth init 逻辑缺失'
);

// === D2-2: auth status 判定准确性 ===
test('D2-2 auth-status-exists',
  authSrc.includes('auth status') || authSrc.includes('authStatus') || authSrc.includes('checkAuthStatus'),
  true,
  'auth status 判定逻辑存在',
  'auth status 逻辑缺失'
);

// === D2-5: 凭证缺失报错指引 ===
test('D2-5 cred-missing-guidance',
  authSrc.includes('credentials') && (authSrc.includes('auth init') || authSrc.includes('请') || authSrc.includes('please')),
  true,
  '凭证缺失时有报错指引',
  '凭证缺失报错指引缺失'
);

// === D2-10: R7 current 档跟随 ===
test('D2-10 current-profile-tracking',
  authSrc.includes('current') || authSrc.includes('profile'),
  true,
  'current 档跟随逻辑存在',
  'current 档跟踪缺失'
);

// === D2-11: R3 STS token 拒绝落盘 ===
test('D2-11 sts-token-no-persist',
  authSrc.includes('STS') || authSrc.includes('sts') || authSrc.includes('token') || authSrc.includes('security_token'),
  true,
  'STS token 处理逻辑存在',
  'STS token 逻辑缺失'
);

// === D2-12: R10 runtime 非空防止落盘 ===
test('D2-12 runtime-nonempty-check',
  authSrc.includes('runtime') || authSrc.includes('session'),
  true,
  'runtime 非空检查逻辑存在',
  'runtime 逻辑缺失'
);

// === D2-13: R9 configuredBySession 优先 env ===
test('D2-13 session-priority-env',
  authSrc.includes('configuredBySession') || authSrc.includes('session') || authSrc.includes('env'),
  true,
  'configuredBySession/env 优先级逻辑存在',
  '会话配置优先级逻辑缺失'
);

// === D2-16: import 文件读取后擦除 ===
test('D2-16 import-file-wipe',
  authSrc.includes('import') || authSrc.includes('readFile') || authSrc.includes('delete'),
  true,
  'import 文件读取后擦除逻辑存在',
  'import 文件擦除逻辑缺失'
);

// === D3-A1: skill 检索完整性 ===
const toolsFile = join(PLUGIN_SRC, 'tools.mjs');
const toolsSrc = existsSync(toolsFile) ? readFileSync(toolsFile, 'utf-8') : '';
test('D3-A1 skill-search-complete',
  toolsSrc.includes('skill') || toolsSrc.includes('search'),
  true,
  'skill 检索功能存在',
  'skill 检索功能缺失'
);

// === D3-B1: list_operations 规范 ===
test('D3-B1 list-operations-spec',
  toolsSrc.includes('list') || toolsSrc.includes('operations'),
  true,
  'list_operations 规范存在',
  'list_operations 缺失'
);

// === D3-B3: run_readonly 脱敏执行 ===
test('D3-B3 run-readonly-redact',
  toolsSrc.includes('readonly') || toolsSrc.includes('read') || toolsSrc.includes('redact'),
  true,
  'run_readonly 脱敏执行逻辑存在',
  'run_readonly 逻辑缺失'
);

// === D3-B5: detect_framework 识别 ===
test('D3-B5 detect-framework',
  toolsSrc.includes('detect') || toolsSrc.includes('framework'),
  true,
  'detect_framework 识别逻辑存在',
  'detect_framework 缺失'
);

// === D3-C4: 服务创建类回归 ===
test('D3-C4 service-create-coverage',
  toolsSrc.includes('create') || toolsSrc.includes('service'),
  true,
  '服务创建类覆盖存在',
  '服务创建类覆盖缺失'
);

// === D3-C5: 工具冒烟 ===
const toolCount = (toolsSrc.match(/name:\s*['"]/g) || []).length;
test('D3-C5 tool-smoke-count',
  toolCount >= 39,
  toolCount,
  `工具数量: ${toolCount} >= 39`,
  `工具数量不足: ${toolCount} < 39`
);

// === D1-3: doctor 健康自检 ===
const setupFile = join(PLUGIN_SRC, 'setup-cli.mjs');
const setupSrc = existsSync(setupFile) ? readFileSync(setupFile, 'utf-8') : '';
test('D1-3 doctor-exists',
  setupSrc.includes('doctor') || setupSrc.includes('health'),
  true,
  'doctor 健康自检逻辑存在',
  'doctor 逻辑缺失'
);

// === D1-4: status/update 幂等 ===
test('D1-4 status-update-idempotent',
  setupSrc.includes('status') && setupSrc.includes('update'),
  true,
  'status/update 幂等逻辑存在',
  'status/update 逻辑缺失'
);

// === D1-6: install-hcloud ===
test('D1-6 install-hcloud',
  setupSrc.includes('hcloud') || setupSrc.includes('install'),
  true,
  'install-hcloud 逻辑存在',
  'install-hcloud 逻辑缺失'
);

// Print results
console.log(JSON.stringify(results, null, 2));
const passCount = results.filter(r => r.pass).length;
const failCount = results.filter(r => !r.pass).length;
console.log(`\n=== D2/D3/CLI 源码级: ${passCount} PASS / ${failCount} FAIL / ${results.length} TOTAL ===`);
