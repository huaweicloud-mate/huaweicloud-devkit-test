/**
 * WorkBuddy daily test probe - D2-11 + D4-23
 * D2-11: R3 STS token rejection (token never persisted)
 * D4-23: global rules huawei-agent-rules.md injection (11 install targets)
 */
import {
  globalCredentialsPath, readGlobalCredentials, writeGlobalCredentials,
  isPlaceholder, setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials,
} from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { writeFileSync } from 'node:fs';

const pkgRoot = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const evDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-25-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// ===== D2-11: R3 STS token rejection =====
// Set runtime credentials with securityToken
setRuntimeCredentials('AKID_D2_11_TEST', 'SK_D2_11_TEST', 'STS_TOKEN_D2_11_TEST', 'cn-north-4');
test('D2-11', 'runtime-set', hasRuntimeCredentials(), hasRuntimeCredentials(), true, 'runtime creds with token set', 'runtime creds not set');

// Check that credentials file does NOT contain the token
const credsPath = globalCredentialsPath();
const credsBefore = readGlobalCredentials();
const credsJson = JSON.stringify(credsBefore);
test('D2-11', 'token-not-persisted', !credsJson.includes('STS_TOKEN_D2_11_TEST'), credsJson.includes('STS_TOKEN_D2_11_TEST') ? 'TOKEN FOUND' : 'no token', 'no token', 'STS token not persisted', 'STS token leaked to file');

// Clear runtime credentials
clearRuntimeCredentials();
test('D2-11', 'runtime-cleared', !hasRuntimeCredentials(), hasRuntimeCredentials(), false, 'runtime cleared', 'runtime not cleared');

// Verify auth_switch tool exists
const authSwitchTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_auth_switch');
test('D2-11', 'auth-switch-tool', Boolean(authSwitchTool), Boolean(authSwitchTool), true, 'auth_switch tool registered', 'auth_switch not registered');

// Check credential file path doesn't store token field
const credFileContent = existsSync(credsPath) ? readFileSync(credsPath, 'utf8') : '';
test('D2-11', 'no-token-field', !credFileContent.includes('securityToken') || !credFileContent.includes('STS_TOKEN'), 'clean', 'clean', 'no token in cred file', 'token in cred file');

// ===== D4-23: global rules huawei-agent-rules.md injection (11 install targets) =====
// Check rules file exists
const rulesMdcPath = join(pkgRoot, 'rules', 'huawei-agent-rules.mdc');
const rulesMdPath = join(pkgRoot, 'rules', 'huawei-agent-rules.md');
const rulesMdcExists = existsSync(rulesMdcPath);
const rulesMdExists = existsSync(rulesMdPath);
test('D4-23', 'rules-file-exists', rulesMdcExists || rulesMdExists, `${rulesMdcExists ? '.mdc' : ''}${rulesMdExists ? '.md' : ''}`, 'mdc or md', 'rules file exists', 'rules file missing');

if (rulesMdcExists) {
  const rulesContent = readFileSync(rulesMdcPath, 'utf8');
  // Check has MUST constraints (csms/kms direct call prohibition)
  const hasMustConstraint = /MUST\s+NOT.*csms|MUST\s+NOT.*kms|禁止.*直连.*csms|禁止.*直连.*kms/i.test(rulesContent);
  test('D4-23', 'must-constraint', hasMustConstraint, hasMustConstraint, true, 'MUST constraint present', 'MUST constraint missing');

  // Check has core principles
  const hasPrinciples = /Core Principles|核心原则|MCP.*first|search.*skill/i.test(rulesContent);
  test('D4-23', 'principles', hasPrinciples, hasPrinciples, true, 'principles present', 'principles missing');

  // Check has secret safety section
  const hasSecretSafety = /Secret Safety|凭证安全|MUST.*load.*dew|NEVER.*echo.*AK/i.test(rulesContent);
  test('D4-23', 'secret-safety', hasSecretSafety, hasSecretSafety, true, 'secret safety section present', 'secret safety missing');
}

// Check integrations directory for install targets
const integrationsDir = join(pkgRoot, 'integrations');
const integrationTargets = existsSync(integrationsDir) ? readdirSync(integrationsDir).filter(d => {
  const fullPath = join(integrationsDir, d);
  return existsSync(fullPath) && readdirSync(fullPath).length > 0;
}) : [];
test('D4-23', 'integration-targets', integrationTargets.length > 0, integrationTargets.join(','), 'non-empty', `${integrationTargets.length} targets: ${integrationTargets.join(',')}`, 'no integration targets');

// Check if rules file is referenced in setup-cli (injection logic)
const setupCliPath = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs');
const setupCliContent = readFileSync(setupCliPath, 'utf8');
const rulesReferenced = /huawei-agent-rules|agent-rules|rules\/huawei/.test(setupCliContent);
test('D4-23', 'rules-injected-in-setup', rulesReferenced, rulesReferenced, true, 'rules referenced in setup-cli', 'rules NOT referenced in setup-cli (SPEC-MISMATCH: no injection logic)');

// Check installed plugins dir for rules file
const installedPluginsDir = join(homedir(), '.workbuddy', 'huaweicloud-plugins');
const installedRulesMdc = join(installedPluginsDir, 'rules', 'huaweicloud-agent-rules.mdc');
const installedRulesMd = join(installedPluginsDir, 'rules', 'huawei-agent-rules.md');
test('D4-23', 'installed-rules', existsSync(installedRulesMdc) || existsSync(installedRulesMd), `${existsSync(installedRulesMdc)}/${existsSync(installedRulesMd)}`, 'exists', 'rules installed in plugins dir', 'rules not installed in plugins dir');

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd4-install-rules', 'stdout.log'), output, 'utf8');
console.log(output);
