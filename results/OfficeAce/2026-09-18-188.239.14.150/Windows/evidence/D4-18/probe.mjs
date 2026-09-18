// AI生成
// D4-18: confirm-not-deny 审批语义
// 检查确认流语义是否正确（confirm 不是 deny）
// In tools.mjs, huaweicloud_auth_confirm handles confirmation tokens.
// The confirm flow should NOT be a deny/block - it should proceed with credential persistence.
// Key check: args.decision === 's1' means "keep existing" (abort), NOT "deny"
// Any other decision means "confirm and proceed" (persist credentials)

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\src';

const toolsContent = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');

// Check 1: huaweicloud_auth_confirm exists and handles token
const hasConfirmHandler = toolsContent.includes("case 'huaweicloud_auth_confirm'");
console.log('Check 1 - huaweicloud_auth_confirm handler exists:', hasConfirmHandler);

// Check 2: confirm flow does NOT use 'deny' decision - it either aborts (s1) or persists
// The 's1' decision means "keep existing account" which is an abort, not a deny
const confirmSection = toolsContent.substring(
  toolsContent.indexOf("case 'huaweicloud_auth_confirm'"),
  toolsContent.indexOf("case 'huaweicloud_auth_confirm'") + 500
);
const usesDenyInConfirm = confirmSection.includes("'deny'") || confirmSection.includes('"deny"');
console.log('Check 2 - confirm flow does NOT use deny decision:', !usesDenyInConfirm);

// Check 3: confirm flow checks token validity (not just blindly allowing)
const checksTokenValidity = confirmSection.includes('pendingConfirms.get') && confirmSection.includes('not found or expired');
console.log('Check 3 - confirm flow validates token:', checksTokenValidity);

// Check 4: s1 decision is "keep existing" (abort), not a deny
const s1IsAbort = confirmSection.includes("args.decision === 's1'") && confirmContent(confirmSection, 'aborted');
function confirmContent(text, keyword) { return text.includes(keyword); }
console.log('Check 4 - s1 decision is abort (not deny):', s1IsAbort);

// Check 5: non-s1 decision proceeds to persistCredentials (confirm = proceed)
const proceedsToPersist = confirmSection.includes('persistCredentials');
console.log('Check 5 - non-s1 decision proceeds to persist:', proceedsToPersist);

const allPass = hasConfirmHandler && !usesDenyInConfirm && checksTokenValidity && s1IsAbort && proceedsToPersist;
console.log('\nD4-18 RESULT:', allPass ? 'PASS' : 'FAIL');
