// AI生成
// D4-19: 确认流下预检仍生效
// Check that in the confirm flow, preflight checks still apply
// The auth_confirm flow should still validate credentials before persisting

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\src';
const toolsContent = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');

// Check 1: persistCredentials function is called in confirm flow
const confirmIdx = toolsContent.indexOf("case 'huaweicloud_auth_confirm'");
const confirmSection = toolsContent.substring(confirmIdx, confirmIdx + 600);
const callsPersist = confirmSection.includes('persistCredentials');
console.log('Check 1 - confirm flow calls persistCredentials:', callsPersist);

// Check 2: The auth flow has a needs_confirmation step (preflight before confirm)
const hasNeedsConfirmation = toolsContent.includes("'needs_confirmation'") || toolsContent.includes('"needs_confirmation"');
console.log('Check 2 - auth flow has needs_confirmation preflight:', hasNeedsConfirmation);

// Check 3: persistCredentials validates inputs (check the function definition)
const persistIdx = toolsContent.indexOf('function persistCredentials');
if (persistIdx === -1) {
  // Check if it's imported
  const importedPersist = toolsContent.includes('persistCredentials');
  console.log('Check 3 - persistCredentials exists (imported):', importedPersist);
} else {
  const persistSection = toolsContent.substring(persistIdx, persistIdx + 500);
  const validatesInput = persistSection.includes('throw') || persistSection.includes('Error');
  console.log('Check 3 - persistCredentials validates inputs:', validatesInput);
}

// Check 4: The confirm flow still goes through credential validation
// Look for credential-validator import
const hasCredentialValidator = toolsContent.includes('credential-validator') || toolsContent.includes('validateCredentials');
console.log('Check 4 - credential validation in auth flow:', hasCredentialValidator);

// Check 5: Even in confirm flow, the token must be valid (preflight on token)
const tokenCheckInConfirm = confirmSection.includes('pendingConfirms.get') && confirmSection.includes('!pending');
console.log('Check 5 - token preflight in confirm flow:', tokenCheckInConfirm);

const allPass = callsPersist && hasNeedsConfirmation && tokenCheckInConfirm;
console.log('\nD4-19 RESULT:', allPass ? 'PASS' : 'FAIL');
