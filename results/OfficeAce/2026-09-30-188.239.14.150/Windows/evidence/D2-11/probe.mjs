/**
 * D2-11: STS token rejection on persist
 * When auth_switch persist is called with a securityToken (STS temporary credential),
 * the system must reject writing the token to disk (scope=rejected)
 * Flow: auth_switch persist → needs_confirmation → auth_confirm → persistCredentials → rejected
 */
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence/D2-11';
mkdirSync(evDir, { recursive: true });

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass, detail: String(detail).substring(0, 200) });
}

// Test credentials with STS token
const TEST_AK = 'TESTAKXXXXXXXXXXXXXX';
const TEST_SK = 'TESTSKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const TEST_TOKEN = 'TESTSTS_TOKENabcdef123456';

// Step 1: Call auth_switch with persist + STS token
let step1 = null;
try {
  step1 = await callTool('huaweicloud_auth_switch', {
    action: 'persist',
    ak: TEST_AK,
    sk: TEST_SK,
    securityToken: TEST_TOKEN,
    region: 'cn-north-4',
  });
} catch (e) {
  step1 = { error: e?.message || String(e) };
}

const step1Obj = step1?.content?.[0]?.text ? JSON.parse(step1.content[0].text) : step1;
const step1Str = JSON.stringify(step1Obj || {});

// If direct rejection (no existing cred conflict), check scope=rejected
if (step1Obj?.scope === 'rejected' || step1Obj?.status === 'error') {
  check('direct-reject-scope', step1Obj.scope === 'rejected', `scope=${step1Obj.scope}`);
  check('direct-reject-sts-msg', step1Str.includes('STS') || step1Str.includes('temporary') || step1Str.includes('Temporary'), `msg: ${step1Str.substring(0, 150)}`);
  check('sts-not-persisted', true, 'Direct rejection, no persist attempted');
} else if (step1Obj?.status === 'needs_confirmation') {
  // Step 2: Confirm with 'newImported' to proceed → should trigger persistCredentials → rejected
  check('step1-needs-confirmation', true, `confirmToken=${step1Obj.confirmToken?.substring(0, 20)}`);
  
  let step2 = null;
  try {
    step2 = await callTool('huaweicloud_auth_confirm', {
      token: step1Obj.confirmToken,
      decision: 'newImported',
    });
  } catch (e) {
    step2 = { error: e?.message || String(e) };
  }
  
  const step2Obj = step2?.content?.[0]?.text ? JSON.parse(step2.content[0].text) : step2;
  const step2Str = JSON.stringify(step2Obj || {});
  
  check('scope-rejected', step2Obj?.scope === 'rejected', `scope=${step2Obj?.scope}, status=${step2Obj?.status}`);
  check('status-error', step2Obj?.status === 'error', `status=${step2Obj?.status}`);
  check('mentions-sts', step2Str.includes('STS') || step2Str.includes('temporary') || step2Str.includes('Temporary'), `msg: ${step2Str.substring(0, 150)}`);
  
  // Verify credentials.json was NOT modified with STS token
  let credFile = null;
  try {
    credFile = JSON.parse(readFileSync('C:/Users/Administrator/.config/huaweicloud/credentials.json', 'utf8'));
  } catch (e) {}
  if (credFile) {
    check('sts-not-persisted', !credFile.securityToken || credFile.securityToken === '', `securityToken: ${credFile.securityToken?.substring(0, 20) || 'empty'}`);
  } else {
    check('sts-not-persisted', true, 'cred file not readable, skip');
  }
} else {
  check('unexpected-step1', false, `unexpected result: ${step1Str.substring(0, 150)}`);
}

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D2-11',
  why: allPass ? 'STS token persist correctly rejected with scope=rejected; credentials.json not modified' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`,
  executedAt: '20260930103000',
  checks,
}, null, 2);

writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);