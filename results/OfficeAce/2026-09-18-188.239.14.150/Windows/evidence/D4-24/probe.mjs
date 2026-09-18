// AI生成
// D4-24: 确认令牌过期与重复确认边界 - 修正版
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\src';
const hcloudContent = readFileSync(join(srcRoot, 'hcloud-cli.mjs'), 'utf8');
const toolsContent = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');

console.log('=== D4-24: Confirmation Token Expiry and Reuse ===');

// Check 1: Approval TTL is defined
const hasTTL = hcloudContent.includes('APPROVAL_TTL_MS');
console.log('Check 1 - Approval TTL defined:', hasTTL);

// Check 2: TTL is 5 * 60_000 = 300000ms (5 minutes)
const ttlMatch = hcloudContent.match(/APPROVAL_TTL_MS\s*=\s*5\s*\*\s*60_000/);
const ttlCorrect = !!ttlMatch;
console.log('Check 2 - TTL is 5 * 60_000 (5 minutes):', ttlCorrect);

// Check 3: consumeApprovalToken deletes token (single-use)
const hasDelete = hcloudContent.includes('delete map[token]');
console.log('Check 3 - Token deleted after consume (single-use):', hasDelete);

// Check 4: Expired tokens are pruned
const hasPrune = hcloudContent.includes('pruneStale') && hcloudContent.includes('APPROVAL_TTL_MS');
console.log('Check 4 - Stale token pruning:', hasPrune);

// Check 5: Expired token consumption returns null
const hasExpiryCheck = hcloudContent.includes('Date.now() - entry.createdAt > APPROVAL_TTL_MS');
console.log('Check 5 - Expiry check on consume:', hasExpiryCheck);

// Check 6: Auth confirm token also has expiry
const hasConfirmExpiry = toolsContent.includes('confirmToken not found or expired');
console.log('Check 6 - Auth confirm token expiry:', hasConfirmExpiry);

// Check 7: Token is UUID (randomUUID)
const hasUUID = hcloudContent.includes('randomUUID');
console.log('Check 7 - Token is UUID:', hasUUID);

// Check 8: Approval file has restricted permissions (mode 0o600)
const hasRestrictedPerms = hcloudContent.includes('0o600');
console.log('Check 8 - Approval file restricted perms:', hasRestrictedPerms);

const d4_24_pass = hasTTL && ttlCorrect && hasDelete && hasPrune && hasExpiryCheck && hasConfirmExpiry && hasUUID && hasRestrictedPerms;
console.log('D4-24 RESULT:', d4_24_pass ? 'PASS' : 'FAIL');
