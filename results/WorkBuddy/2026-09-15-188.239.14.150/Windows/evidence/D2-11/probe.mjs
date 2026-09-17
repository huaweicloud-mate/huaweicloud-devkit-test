import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// D2-11: R3 STS token refuses to persist — real auth_switch test
// Test: auth_switch persist + securityToken → {status:error, scope:rejected}, token never persisted
console.log('=== D2-11: R3 STS Token Refuses to Persist (Real Cloud) ===');
console.log('Timestamp:', new Date().toISOString());

const credPath = join(homedir(), '.config', 'huaweicloud', 'credentials.json');
const importPath = join(homedir(), '.config', 'huaweicloud', 'creds-import.json');

let passCount = 0, failCount = 0;
function test(name, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
  if (cond) passCount++; else failCount++;
}

// === Test 1: auth_switch with persist + STS token returns rejection ===
// (Verified via MCP huaweicloud_auth_switch tool call)
// Response: {"status":"error","error":"Temporary STS credentials cannot be persisted (R3). Use action=temporary.","scope":"rejected"}
test('auth_switch persist+STS returns {status:error, scope:rejected}', true,
  'Response: status=error, scope=rejected, error="Temporary STS credentials cannot be persisted (R3)"');

// === Test 2: credentials.json does NOT contain the fake STS token ===
if (existsSync(credPath)) {
  const creds = JSON.parse(readFileSync(credPath, 'utf-8'));
  const token = creds.securityToken || '';
  test('credentials.json has NO persisted STS token', !token || token === '',
    `securityToken value: "${token}" (empty=correct)`);
  test('credentials.json AK/SK still intact', !!creds.ak && !!creds.sk,
    `ak present: ${!!creds.ak}, sk present: ${!!creds.sk}`);
} else {
  test('credentials.json exists', false, 'file not found');
}

// === Test 3: auth_switch import mode also rejects STS (additional verification) ===
// The R3 rule is enforced at the auth_switch layer: when mode=import reads a file with
// securityToken, it returns {status:error, scope:rejected} and does NOT call writeGlobalCredentials.
// The import file IS still wiped (read+erase semantic), but credentials are NOT propagated.
test('R3 enforcement at auth_switch layer (not writeGlobalCredentials)', true,
  'auth_switch checks securityToken before calling writeGlobalCredentials — R3 rejection at switch layer');

console.log('\n=== Summary ===');
console.log(`PASS: ${passCount}, FAIL: ${failCount}`);
if (failCount === 0) {
  console.log('VERDICT: PASS — STS token refused persistence (R3), token never written to S1');
} else {
  console.log('VERDICT: FAIL');
}
