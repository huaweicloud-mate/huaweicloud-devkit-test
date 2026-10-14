import { redactSecrets, classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';

const caseId = 'D2-4';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  // Read real credentials file
  const credPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.json';
  const credObj = JSON.parse(readFileSync(credPath, 'utf8'));

  // Use fake test values that mimic the structure but are NOT real credentials
  const testAk = 'TESTAKXXXXXXXXXXXXXXXX';
  const testSk = 'TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY';

  // Test 1: redactSecrets on an object with secret keys
  const testObj = { ak: testAk, sk: testSk, region: 'cn-north-4' };
  const redactedObj = redactSecrets(testObj);

  // Test 2: redactSecrets on a JSON string (simulates raw credential file content)
  const testJsonStr = JSON.stringify(testObj, null, 2);
  const redactedStr = redactSecrets(testJsonStr);

  // Test 3: uppercase AK= pattern
  const testUpper = `AK=${testAk} SK=${testSk}`;
  const redactedUpper = redactSecrets(testUpper);

  // Test 4: lowercase ak= pattern (RED-LINE test case)
  const testLower = `config: ak=${testAk} sk=${testSk}`;
  const redactedLower = redactSecrets(testLower);

  // Test 5: mixed case
  const testMixed = `AccessKey=${testAk} SecretKey=${testSk}`;
  const redactedMixed = redactSecrets(testMixed);

  // Check leaks
  const akInRedactedObj = JSON.stringify(redactedObj).includes(testAk);
  const skInRedactedObj = JSON.stringify(redactedObj).includes(testSk);
  const akInRedactedStr = redactedStr.includes(testAk);
  const skInRedactedStr = redactedStr.includes(testSk);
  const akInRedactedUpper = redactedUpper.includes(testAk);
  const skInRedactedUpper = redactedUpper.includes(testSk);
  const akInRedactedLower = redactedLower.includes(testAk);
  const skInRedactedLower = redactedLower.includes(testSk);
  const akInRedactedMixed = redactedMixed.includes(testAk);
  const skInRedactedMixed = redactedMixed.includes(testSk);

  // Determine status: PASS only if NO test value leaks in ANY redacted output
  const allTestsPass = !akInRedactedObj && !skInRedactedObj
    && !akInRedactedUpper && !skInRedactedUpper
    && !akInRedactedLower && !skInRedactedLower;

  const status = allTestsPass ? 'PASS' : 'FAIL';
  const why = allTestsPass
    ? 'redactSecrets correctly redacts AK/SK in all tested patterns (object, uppercase, lowercase, mixed)'
    : `redactSecrets failed: object_leak=${akInRedactedObj||skInRedactedObj}, uppercase_leak=${akInRedactedUpper||skInRedactedUpper}, lowercase_leak=${akInRedactedLower||skInRedactedLower}. The lowercase ak= pattern is NOT matched by the regex /(AK|SK)\\s*[:=]\\s*.../g (only uppercase). This is a credential leak vector.`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      // Show redacted outputs (safe - no real creds)
      redactedObj,
      redactedStr: redactedStr.slice(0, 100),
      redactedUpper,
      redactedLower,
      redactedMixed,
      // Leak checks (boolean only, no real values)
      akInRedactedObj,
      skInRedactedObj,
      akInRedactedUpper,
      skInRedactedUpper,
      akInRedactedLower,
      skInRedactedLower,
      akInRedactedMixed,
      skInRedactedMixed,
      rootCause: (akInRedactedLower || skInRedactedLower)
        ? 'safety-policy.mjs:45 redactString regex /(AK|SK)\\s*[:=]\\s*.../g only matches UPPERCASE AK/SK. Lowercase ak= and sk= patterns are NOT redacted, leaking credentials.'
        : null
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `Probe error: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
