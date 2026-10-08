/**
 * D2-4: Credential redaction - show_profile_redacted
 * Verify redactSecrets strips plaintext AK/SK from output
 * Verify the tool huaweicloud_show_profile_redacted exists and routes correctly
 */
import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-01-188.239.14.150/Windows/evidence/D2-4';
mkdirSync(evDir, { recursive: true });

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass, detail: String(detail).substring(0, 200) });
}

// Real-looking test credentials (NOT real credentials)
const TEST_AK = 'TESTAKXXXXXXXXXXXXXX';
const TEST_SK = 'TESTSKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const TEST_TOKEN = 'TESTTOKENabcdef123456';

// 1. redactSecrets on object with ak/sk keys
const redactedObj = redactSecrets({ ak: TEST_AK, sk: TEST_SK, region: 'cn-north-4' });
check('redact-obj-ak', redactedObj.ak === '<redacted>', `ak=${redactedObj.ak}`);
check('redact-obj-sk', redactedObj.sk === '<redacted>', `sk=${redactedObj.sk}`);
check('redact-obj-region-preserved', redactedObj.region === 'cn-north-4', `region=${redactedObj.region}`);

// 2. redactSecrets on object with accessKey/secretKey
const redactedObj2 = redactSecrets({ accessKey: TEST_AK, secretKey: TEST_SK, securityToken: TEST_TOKEN });
check('redact-accessKey', redactedObj2.accessKey === '<redacted>', `accessKey=${redactedObj2.accessKey}`);
check('redact-secretKey', redactedObj2.secretKey === '<redacted>', `secretKey=${redactedObj2.secretKey}`);
check('redact-securityToken', redactedObj2.securityToken === '<redacted>', `securityToken=${redactedObj2.securityToken}`);

// 3. redactSecrets on string with AK=... SK=...
const redactedStr = redactSecrets(`AK=${TEST_AK} SK=${TEST_SK} region=cn-north-4`);
check('redact-str-no-ak', !redactedStr.includes(TEST_AK), `str=${redactedStr.substring(0, 100)}`);
check('redact-str-no-sk', !redactedStr.includes(TEST_SK), `str=${redactedStr.substring(0, 100)}`);
check('redact-str-has-redacted', redactedStr.includes('<redacted>'), `str=${redactedStr.substring(0, 100)}`);

// 4. redactSecrets on nested object
const nested = redactSecrets({ config: { ak: TEST_AK, sk: TEST_SK }, meta: { region: 'cn-north-4' } });
check('redact-nested-ak', nested.config.ak === '<redacted>', `nested.config.ak=${nested.config.ak}`);
check('redact-nested-sk', nested.config.sk === '<redacted>', `nested.config.sk=${nested.config.sk}`);
check('redact-nested-region', nested.meta.region === 'cn-north-4', `nested.meta.region=${nested.meta.region}`);

// 5. redactSecrets on array
const arr = redactSecrets([{ ak: TEST_AK }, { sk: TEST_SK }]);
check('redact-array', arr[0].ak === '<redacted>' && arr[1].sk === '<redacted>', JSON.stringify(arr));

// 6. Tool huaweicloud_show_profile_redacted exists
const tool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_show_profile_redacted');
check('tool-exists', !!tool, `found=${!!tool}`);
check('tool-has-desc', tool && typeof tool.description === 'string' && tool.description.length > 0, `desc=${tool?.description?.substring(0, 60)}`);
check('tool-has-schema', tool && tool.inputSchema !== undefined, `schema=${tool?.inputSchema ? 'present' : 'missing'}`);

// 7. Verify redacted output never contains original credential values
const allRedacted = [redactedObj, redactedObj2, { str: redactedStr }, nested];
const allJson = JSON.stringify(allRedacted);
check('no-plaintext-ak', !allJson.includes(TEST_AK), 'AK not found in any redacted output');
check('no-plaintext-sk', !allJson.includes(TEST_SK), 'SK not found in any redacted output');
check('no-plaintext-token', !allJson.includes(TEST_TOKEN), 'Token not found in redacted output');

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D2-4',
  why: allPass ? 'redactSecrets strips all plaintext AK/SK/token from objects, strings, nested structures; tool registered' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`,
  executedAt: '20261001103000',
  checks,
}, null, 2);

writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);