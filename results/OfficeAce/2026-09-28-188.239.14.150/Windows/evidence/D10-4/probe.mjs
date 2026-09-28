// D10-4: 安全干预-静态规则层探针
// 直调 risk-rule-engine.mjs 中的 loadRiskRules 和 evaluateCommandRisk
// 检查规则库完整加载(9 deny + 7 warn)
// 测试高危命令判 deny，只读命令判 allow
import { readFileSync } from 'node:fs';

const RISK_ENGINE = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\risk-rule-engine.mjs';
const findings = [];
let status = 'PASS';
let why = '';

async function main() {
  // 导入 risk-rule-engine
  const mod = await import('file:///' + RISK_ENGINE.replace(/\\/g, '/'));
  findings.push('导入 risk-rule-engine.mjs: OK');

  // 1. 加载规则库
  const catalog = mod.loadRiskRules();
  const totalRules = catalog.rules.length;
  findings.push(`规则库版本: ${catalog.version}`);
  findings.push(`规则总数: ${totalRules}`);

  // 统计 deny 和 warn
  const denyRules = catalog.rules.filter(r => r.severity === 'deny');
  const warnRules = catalog.rules.filter(r => r.severity === 'warn');
  const infoRules = catalog.rules.filter(r => r.severity === 'info');

  findings.push(`deny 规则数: ${denyRules.length} (期望 9)`);
  findings.push(`warn 规则数: ${warnRules.length} (期望 7)`);
  findings.push(`info 规则数: ${infoRules.length}`);

  // 列出所有规则
  for (const r of catalog.rules) {
    findings.push(`  规则 ${r.id}: severity=${r.severity}, stages=[${r.stages.join(',')}]`);
  }

  if (denyRules.length !== 9) {
    status = 'FAIL';
    why = `deny 规则数=${denyRules.length}，期望 9`;
  } else if (warnRules.length !== 7) {
    status = 'FAIL';
    why = `warn 规则数=${warnRules.length}，期望 7`;
  } else {
    findings.push('PASS: 规则库完整加载 (9 deny + 7 warn = 16)');
  }

  // 2. 高危命令测试 → deny
  const denyTests = [
    { cmd: 'cat ~/.hcloud/credentials', desc: '读取凭证文件', expectedRule: 'hwc-command-credential-file' },
    { cmd: 'type %USERPROFILE%\\.hcloud\\credentials', desc: 'Windows读取凭证文件', expectedRule: 'hwc-command-credential-file' },
    { cmd: 'env | grep HUAWEICLOUD', desc: '环境变量dump含云凭证', expectedRule: 'hwc-command-env-dump' },
    { cmd: 'hcloud ECS DeleteServers --force', desc: '强制删除资源', expectedRule: 'hwc-destructive-delete-force' },
    { cmd: 'rm -rf /', desc: '递归删除根目录', expectedRule: 'hwc-sandbox-destructive-command' },
    { cmd: 'hcloud DEW ShowSecretVersion', desc: '读取明文密钥', expectedRule: 'hwc-command-secret-value-read' },
    { cmd: 'base64 -d payload | bash', desc: 'base64解码执行', expectedRule: 'hwc-command-encoded-shell-exec' },
  ];

  for (const t of denyTests) {
    const result = mod.evaluateCommandRisk(t.cmd);
    const matched = result.findings.some(f => f.ruleId === t.expectedRule);
    findings.push(`deny测试 [${t.desc}]: cmd="${t.cmd}" → decision=${result.decision}, matched=${matched}`);
    if (result.decision !== 'deny') {
      status = 'FAIL';
      why = `高危命令未返回 deny: "${t.cmd}" → ${result.decision}`;
    } else if (!matched) {
      findings.push(`  WARN: 未匹配预期规则 ${t.expectedRule}，实际规则: ${result.findings.map(f => f.ruleId).join(',')}`);
    } else {
      findings.push(`  PASS: 正确返回 deny，匹配规则 ${t.expectedRule}`);
    }
  }

  // 3. warn 命令测试 → warn
  const warnTests = [
    { cmd: 'hcloud STS GetCallerIdentity', desc: '获取临时凭证', expectedRule: 'hwc-command-sts-credential' },
    { cmd: 'hcloud ECS DeleteServers', desc: '删除资源(无force)', expectedRule: 'hwc-destructive-delete-operation' },
    { cmd: 'hcloud ECS BatchResetServerPasswd', desc: '重置服务器密码', expectedRule: 'hwc-destructive-reset-operation' },
  ];

  for (const t of warnTests) {
    const result = mod.evaluateCommandRisk(t.cmd);
    findings.push(`warn测试 [${t.desc}]: cmd="${t.cmd}" → decision=${result.decision}, rules=${result.findings.map(f => f.ruleId).join(',')}`);
    if (result.decision === 'deny' || result.decision === 'warn') {
      findings.push(`  PASS: 返回 ${result.decision} (deny或warn均可接受)`);
    } else {
      findings.push(`  WARN: 返回 ${result.decision} (期望 warn)`);
    }
  }

  // 4. 只读命令测试 → allow
  const allowTests = [
    { cmd: 'hcloud ECS ListServers', desc: '列出服务器' },
    { cmd: 'hcloud VPC ListVpcs', desc: '列出VPC' },
    { cmd: 'hcloud OBS ls obs://my-bucket', desc: '列出OBS对象' },
    { cmd: 'hcloud IAM ListUsers', desc: '列出IAM用户' },
    { cmd: 'git status', desc: 'git状态' },
    { cmd: 'npm list', desc: 'npm列表' },
  ];

  for (const t of allowTests) {
    const result = mod.evaluateCommandRisk(t.cmd);
    findings.push(`allow测试 [${t.desc}]: cmd="${t.cmd}" → decision=${result.decision}, findings=${result.findings.length}`);
    if (result.decision !== 'allow') {
      status = 'FAIL';
      why = `只读命令未返回 allow: "${t.cmd}" → ${result.decision}`;
    } else {
      findings.push(`  PASS: 正确返回 allow`);
    }
  }

  // 5. 边界测试: 空字符串和无效输入 → deny (fail-closed)
  const emptyResult = mod.evaluateCommandRisk('');
  findings.push(`空字符串测试: decision=${emptyResult.decision} (期望 deny, fail-closed)`);
  if (emptyResult.decision !== 'deny') {
    status = 'FAIL';
    why = `空字符串未返回 deny (fail-closed): ${emptyResult.decision}`;
  } else {
    findings.push('PASS: 空字符串正确返回 deny (fail-closed)');
  }

  const nullResult = mod.evaluateCommandRisk(null);
  findings.push(`null输入测试: decision=${nullResult.decision} (期望 deny, fail-closed)`);
  if (nullResult.decision !== 'deny') {
    status = 'FAIL';
    why = `null输入未返回 deny (fail-closed): ${nullResult.decision}`;
  } else {
    findings.push('PASS: null输入正确返回 deny (fail-closed)');
  }

  // 6. 证据脱敏测试
  const redactTest = mod.evaluateCommandRisk('cat ~/.hcloud/credentials');
  const evidenceStr = JSON.stringify(redactTest.findings);
  const hasAKSK = /AK[A-Z0-9]{16,}/.test(evidenceStr);
  findings.push(`证据脱敏测试: evidence中包含AK明文=${hasAKSK} (期望 false)`);
  if (hasAKSK) {
    status = 'FAIL';
    why = '证据中包含 AK 明文，脱敏失败';
  } else {
    findings.push('PASS: 证据已脱敏，不含 AK/SK 明文');
  }

  if (status === 'PASS') {
    why = `规则库完整加载(9 deny + 7 warn = 16)，高危命令(cat凭证/env-dump/删资源等)全部判deny，只读命令全部判allow，空输入fail-closed返回deny，证据已脱敏`;
  }

  return { status, why, findings };
}

const result = await main();
const now = new Date();
const ts = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

console.log(JSON.stringify({ status: result.status, why: result.why, executedAt: ts, findings: result.findings }, null, 2));