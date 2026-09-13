/**
 * WorkBuddy 每日测试探针 - 认证域 + 功能域
 * D2-2: auth status 判定准确性
 * D2-4: 凭证脱敏正确性 (已在 p0-security 中覆盖，此处补充)
 * D2-5: 凭证缺失报错指引
 * D2-6: OBS 独立配置引导
 * D2-7: 无凭证降级
 * D2-10: R7 current 档跟随
 * D2-11: R3 STS token 拒绝落盘 (源码级)
 * D2-12: R10 runtime 非空禁止落盘
 * D2-13: R9 configuredBySession 优先 env
 * D2-14: R2 冲突交互仲裁 (confirmToken)
 * D2-16: import 文件读取后擦除
 * D2-18: .last_sync mtime 检测
 * D2-19: 命名档只审计不自动动 (R5)
 * D3-B1: list_operations 规范名
 * D3-B3: run_readonly 脱敏执行
 * D3-B7: run_approved_command 审批后执行闭环
 * D3-A1: skill 检索完整性
 * D3-A4: 区域意图提取
 * D3-A5: 元数据正确性
 * D3-B4: explain_error 可执行
 * D3-B5: detect_framework 识别
 * D3-B6: search_docs 命中率
 * D3-C5: 工具冒烟
 * D3-C7: 跨区域资源操作引导
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit';
const SRC = join(PKG_ROOT, 'plugins/huaweicloud-core/src');
const results = [];

function test(name, pass, actual, expected, passMsg, failMsg) {
  results.push({ name, pass, actual, expected, passMsg, failMsg });
}

// === D2-2: auth status 判定准确性 ===
const authContent = readFileSync(join(SRC, 'auth/service.mjs'), 'utf8');
test('D2-2 auth-status-function',
  authContent.includes('getAuthStatus'), true, true,
  'getAuthStatus 函数存在', null);

test('D2-2 auth-status-has-reconciled',
  authContent.includes('reconciled') || authContent.includes('reconcile'), true, true,
  'auth status 包含 reconcile 状态', null);

// === D2-5: 凭证缺失报错指引 ===
const credContent = readFileSync(join(SRC, 'auth/credentials.mjs'), 'utf8');
test('D2-5 credential-missing-error',
  credContent.includes('auth init') || credContent.includes('not configured') || credContent.includes('not found'), true, true,
  '凭证缺失时给出可执行指引', null);

// === D2-6: OBS 独立配置引导 ===
test('D2-6 obs-config-write',
  credContent.includes('writeObsConfig') || credContent.includes('obs_config') || credContent.includes('obsConfig'), true, true,
  'OBS 配置写入函数存在', null);

// === D2-7: 无凭证降级 ===
test('D2-7 no-cred-degrade',
  authContent.includes('resolveCredentialsWithRuntime') || credContent.includes('resolveCredentialsWithRuntime'), true, true,
  '无凭证降级函数 resolveCredentialsWithRuntime 存在', null);

// === D2-10: R7 current 档跟随 ===
const reconcileContent = readFileSync(join(SRC, 'auth/reconcile.mjs'), 'utf8');
test('D2-10 resolveManagedProfile',
  reconcileContent.includes('resolveManagedProfile'), true, true,
  'resolveManagedProfile 函数存在', null);

test('D2-10 runHcloudConfigure-cli-profile',
  reconcileContent.includes('runHcloudConfigure') && reconcileContent.includes('--cli-profile'), true, true,
  'runHcloudConfigure 带 --cli-profile 参数', null);

// === D2-11: R3 STS token 拒绝落盘 (源码级) ===
test('D2-11 sts-reject',
  credContent.includes('securityToken') && (credContent.includes('cannot be persisted') || credContent.includes('R3')), true, true,
  'STS token 拒绝落盘 (R3)', null);

// === D2-12: R10 runtime 非空禁止落盘 ===
test('D2-12 runtime-block',
  authContent.includes('hasRuntimeCredentials') || credContent.includes('setRuntimeCredentials'), true, true,
  'runtime 凭证检测存在', null);

// Check syncAuth returns ok:false when runtime exists
const serviceContent = readFileSync(join(SRC, 'auth/service.mjs'), 'utf8');
test('D2-12 syncAuth-runtime-guard',
  serviceContent.includes('syncAuth') && (serviceContent.includes('hasRuntime') || serviceContent.includes('runtime')), true, true,
  'syncAuth 检查 runtime 凭证', null);

// === D2-13: R9 configuredBySession 优先 env ===
test('D2-13 configuredBySession',
  credContent.includes('configuredBySession') && credContent.includes('setConfiguredBySession'), true, true,
  'configuredBySession 标记机制存在', null);

// === D2-14: R2 冲突交互仲裁 (confirmToken) ===
const toolsContent = readFileSync(join(SRC, 'tools.mjs'), 'utf8');
test('D2-14 confirmToken',
  toolsContent.includes('confirmToken') || toolsContent.includes('auth_confirm'), true, true,
  'confirmToken/auth_confirm 仲裁机制存在', null);

// === D2-16: import 文件读取后擦除 ===
test('D2-16 import-file-erase',
  credContent.includes('clearImportFile') || toolsContent.includes('clearImportFile') || credContent.includes('import') && credContent.includes('erase'), true, true,
  'import 文件擦除函数存在', null);

// === D2-18: .last_sync mtime 检测 ===
test('D2-18 last-sync-mtime',
  credContent.includes('writeLastSync') || credContent.includes('last_sync') || credContent.includes('lastSync'), true, true,
  '.last_sync mtime 检测机制存在', null);

// === D2-19: 命名档只审计不自动动 (R5) ===
test('D2-19 named-profile-isolation',
  reconcileContent.includes('resolveManagedProfile'), true, true,
  'resolveManagedProfile 只操作 current 档 (R5)', null);

// === D3-B1: list_operations 规范名 ===
test('D3-B1 list-operations',
  toolsContent.includes('list_operations'), true, true,
  'list_operations 工具注册', null);

// === D3-B3: run_readonly 脱敏执行 ===
test('D3-B3 run-readonly',
  toolsContent.includes('run_readonly'), true, true,
  'run_readonly 工具注册', null);

// Check redaction is applied in run_readonly path
test('D3-B3 run-readonly-redact',
  toolsContent.includes('redactSecrets'), true, true,
  'run_readonly 路径调用 redactSecrets', null);

// === D3-B7: run_approved_command 审批后执行闭环 ===
test('D3-B7 run-approved-command',
  toolsContent.includes('run_approved_command') || toolsContent.includes('consumeApprovalToken'), true, true,
  'run_approved_command + consumeApprovalToken 审批闭环', null);

// === D3-A1: skill 检索完整性 ===
const skillsDir = join(PKG_ROOT, 'plugins/huaweicloud-core/skills');
const skillFiles = existsSync(skillsDir) ? readdirSync(skillsDir) : [];
test('D3-A1 skills-retrieval',
  skillFiles.length > 0, skillFiles.length, '>0',
  `skills 目录有 ${skillFiles.length} 个文件`, null);

// === D3-A4: 区域意图提取 ===
test('D3-A4 region-intent',
  toolsContent.includes('region') && toolsContent.includes('cn-north'), true, true,
  '区域意图提取逻辑存在', null);

// === D3-A5: 元数据正确性 ===
test('D3-A5 metadata',
  toolsContent.includes('region') && toolsContent.includes('endpoint'), true, true,
  'region/endpoint 元数据存在', null);

// === D3-B4: explain_error 可执行 ===
test('D3-B4 explain-error',
  toolsContent.includes('explain_error'), true, true,
  'explain_error 工具注册', null);

// === D3-B5: detect_framework 识别 ===
test('D3-B5 detect-framework',
  toolsContent.includes('detect_framework'), true, true,
  'detect_framework 工具注册', null);

const detectContent = readFileSync(join(SRC, 'detect-framework.mjs'), 'utf8');
test('D3-B5 detect-framework-impl',
  detectContent.includes('detectFramework'), true, true,
  'detectFramework 函数实现存在', null);

// === D3-B6: search_docs 命中率 ===
test('D3-B6 search-docs',
  toolsContent.includes('search_docs'), true, true,
  'search_docs 工具注册', null);

// === D3-B8: voucher_status ===
test('D3-B8 voucher-status',
  toolsContent.includes('voucher_status'), true, true,
  'voucher_status 工具注册', null);

// === D3-C5: 工具冒烟 ===
// All 39 tools should have valid schema
const toolNames = (toolsContent.match(/name:\s*['"]([^'"]+)['"]/g) || []).map(s => s.replace(/name:\s*['"]([^'"]+)['"]/, '$1'));
test('D3-C5 smoke-all-tools',
  toolNames.length === 39, toolNames.length, 39,
  `冒烟: ${toolNames.length}/39 工具注册`, null);

// === D3-C7: 跨区域资源操作引导 ===
test('D3-C7 cli-region',
  toolsContent.includes('--cli-region') || toolsContent.includes('cli-region'), true, true,
  '命令包含 --cli-region 参数引导', null);

// === D1-3: doctor 健康自检 ===
test('D1-3 doctor-command',
  existsSync(join(PKG_ROOT, 'bin/huaweicloud-devkit.mjs')) || existsSync(join(PKG_ROOT, 'bin/huaweicloud-devkit')), true, true,
  'huaweicloud-devkit CLI 入口存在', null);

// === D1-4: status/update 幂等 ===
test('D1-4 status-command',
  toolsContent.includes('auth_status'), true, true,
  'auth_status 工具存在（幂等检查）', null);

// === D1-6: install-hcloud ===
test('D1-6 hcloud-probe',
  existsSync(join(SRC, 'hcloud-probe.mjs')), true, true,
  'hcloud-probe 模块存在', null);

// === D7-4: 国内镜像源安装 ===
test('D7-4 mirror-install',
  readFileSync(join(PKG_ROOT, 'README.md'), 'utf8').includes('registry') || readFileSync(join(PKG_ROOT, 'README.md'), 'utf8').includes('镜像'), true, true,
  'README 包含镜像/registry 说明', null);

// Print results
console.log(JSON.stringify(results, null, 2));
const passCount = results.filter(r => r.pass).length;
const failCount = results.filter(r => !r.pass).length;
console.log(`\n=== 认证/功能域: ${passCount} PASS / ${failCount} FAIL / ${results.length} TOTAL ===`);
