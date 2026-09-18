// AI生成
// D4-20: 拒绝后零操作
// D4-4: 写操作审批门
// D4-6: adminPass 回显警告
// Check denial results in zero operation, write approval gate logic, adminPass redaction

import { classifyHcloudArgs, redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\src';
const toolsContent = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');
const hcloudContent = readFileSync(join(srcRoot, 'hcloud-cli.mjs'), 'utf8');

console.log('=== D4-20: Zero Operation After Denial ===');

// Check 1: assertAllowed throws on deny
const hasAssertAllowed = toolsContent.includes('assertAllowed') || 
                         hcloudContent.includes('assertAllowed') ||
                         readFileSync(join(srcRoot, 'safety-policy.mjs'), 'utf8').includes('assertAllowed');
console.log('Check 1 - assertAllowed exists:', hasAssertAllowed);

// Check 2: Denied write operation returns decision=deny (no execution)
const denyResult = classifyHcloudArgs(['hcloud', 'ECS', 'DeleteServers', '--server_ids=xxx']);
const isDenied = denyResult.decision === 'deny';
console.log('Check 2 - Write op denied without approval:', isDenied);

// Check 3: The runHcloud function checks decision before executing
const hasDecisionCheck = hcloudContent.includes("decision === 'deny'") || 
                         hcloudContent.includes("decision !== 'allow'") ||
                         hcloudContent.includes('assertAllowed');
console.log('Check 3 - Decision check before execution:', hasDecisionCheck);

// Check 4: approvedByUser must be explicitly true
const hasApprovalCheck = toolsContent.includes("approvedByUser !== true") ||
                         toolsContent.includes("approvedByUser === true");
console.log('Check 4 - approvedByUser explicit check:', hasApprovalCheck);

const d4_20_pass = hasAssertAllowed && isDenied && hasDecisionCheck && hasApprovalCheck;
console.log('D4-20 RESULT:', d4_20_pass ? 'PASS' : 'FAIL');

console.log('\n=== D4-4: Write Operation Approval Gate ===');

// Check 1: planHcloudCommand creates approval token
const hasPlanFunction = hcloudContent.includes('export function planHcloudCommand');
console.log('Check 1 - planHcloudCommand exists:', hasPlanFunction);

// Check 2: Approval token is created and stored
const hasTokenCreation = hcloudContent.includes('createApprovalToken') &&
                         hcloudContent.includes('approvalToken');
console.log('Check 2 - Approval token created:', hasTokenCreation);

// Check 3: consumeApprovalToken validates and consumes token
const hasTokenConsume = hcloudContent.includes('export function consumeApprovalToken') &&
                        hcloudContent.includes('delete map[token]');
console.log('Check 3 - Token consumed (single-use):', hasTokenConsume);

// Check 4: approvedByUser must be true, args must match
const hasArgsMatch = toolsContent.includes('hashArgs') &&
                     toolsContent.includes('do not match the approved plan');
console.log('Check 4 - Args hash matching:', hasArgsMatch);

// Check 5: allowWrites=true only after approval
const allowWritesResult = classifyHcloudArgs(['hcloud', 'ECS', 'CreateServers'], { allowWrites: true });
const allowWorks = allowWritesResult.decision === 'allow';
console.log('Check 5 - allowWrites=true allows write:', allowWorks);

const d4_4_pass = hasPlanFunction && hasTokenCreation && hasTokenConsume && hasArgsMatch && allowWorks;
console.log('D4-4 RESULT:', d4_4_pass ? 'PASS' : 'FAIL');

console.log('\n=== D4-6: adminPass Redaction Warning ===');

// Check 1: redactSecrets redacts adminPass
const testObj = { adminPass: 'MySecret123!', name: 'test-instance' };
const redacted = redactSecrets(testObj);
const adminPassRedacted = redacted.adminPass === '<redacted>';
console.log('Check 1 - adminPass redacted in object:', adminPassRedacted);

// Check 2: redactSecrets redacts password in string
const testStr = 'adminPass=MySecret123!';
const redactedStr = redactSecrets(testStr);
const strRedacted = redactedStr.includes('<redacted>') && !redactedStr.includes('MySecret123!');
console.log('Check 2 - adminPass redacted in string:', strRedacted);

// Check 3: isSecretKeyName detects adminPass
const safetyContent = readFileSync(join(srcRoot, 'safety-policy.mjs'), 'utf8');
const hasAdminPass = safetyContent.includes('adminPass');
console.log('Check 3 - adminPass in secret key detection:', hasAdminPass);

// Check 4: password also redacted
const testObj2 = { password: 'SecretPass!', AccessKey: 'AKXYZ' };
const redacted2 = redactSecrets(testObj2);
const passwordRedacted = redacted2.password === '<redacted>';
const akRedacted = redacted2.AccessKey === '<redacted>';
console.log('Check 4 - password redacted:', passwordRedacted, ', AccessKey redacted:', akRedacted);

const d4_6_pass = adminPassRedacted && strRedacted && hasAdminPass && passwordRedacted && akRedacted;
console.log('D4-6 RESULT:', d4_6_pass ? 'PASS' : 'FAIL');
