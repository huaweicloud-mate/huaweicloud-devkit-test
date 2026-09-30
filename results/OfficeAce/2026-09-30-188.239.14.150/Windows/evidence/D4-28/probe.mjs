/**
 * D4-28: Redaction of command output
 * redactSecrets must strip AK/SK/token from hcloud command output
 * redactOutput must scrub credentials from stdout/stderr
 */
import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence/D4-28';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

const AK = 'AKTESTXXXXXXXXXXXXXX';
const SK = 'SKTESTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// 1. Redact JSON output with credentials
const jsonOut = JSON.stringify({ data: { ak: AK, sk: SK, region: 'cn-north-4' } });
const redactedJson = redactSecrets(JSON.parse(jsonOut));
check('json-ak-redacted', !JSON.stringify(redactedJson).includes(AK), `ak=${redactedJson.data.ak}`);
check('json-sk-redacted', !JSON.stringify(redactedJson).includes(SK), `sk=${redactedJson.data.sk}`);
check('json-region-preserved', redactedJson.data.region === 'cn-north-4', `region=${redactedJson.data.region}`);

// 2. Redact string output with AK=... SK=...
const strOut = `Configuration:\n  AK = ${AK}\n  SK = ${SK}\n  region = cn-north-4`;
const redactedStr = redactSecrets(strOut);
check('str-ak-redacted', !redactedStr.includes(AK), `contains AK: ${redactedStr.includes(AK)}`);
check('str-sk-redacted', !redactedStr.includes(SK), `contains SK: ${redactedStr.includes(SK)}`);
check('str-has-redacted-marker', redactedStr.includes('<redacted>'), `has marker: ${redactedStr.includes('<redacted>')}`);

// 3. Redact nested JSON (hcloud output format)
const hcloudOut = { items: [{ access_key: AK, secret_key: SK, name: 'server1' }] };
const redactedNested = redactSecrets(hcloudOut);
check('nested-ak-redacted', redactedNested.items[0].access_key === '<redacted>', `ak=${redactedNested.items[0].access_key}`);
check('nested-sk-redacted', redactedNested.items[0].secret_key === '<redacted>', `sk=${redactedNested.items[0].secret_key}`);
check('nested-name-preserved', redactedNested.items[0].name === 'server1', `name=${redactedNested.items[0].name}`);

// 4. Redact array of strings
const arrOut = [`AK=${AK}`, `SK=${SK}`, 'region=cn-north-4'];
const redactedArr = redactSecrets(arrOut);
check('arr-no-ak', !redactedArr.some(s => s.includes(AK)), JSON.stringify(redactedArr));
check('arr-no-sk', !redactedArr.some(s => s.includes(SK)), JSON.stringify(redactedArr));

// 5. Non-credential data passes through
const plain = { server: 'ecs-001', status: 'running', id: '123456' };
const redactedPlain = redactSecrets(plain);
check('plain-preserved', JSON.stringify(redactedPlain) === JSON.stringify(plain), 'non-cred data preserved');

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D4-28', why: allPass ? 'Output redaction correctly strips credentials from JSON, strings, nested structures' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20260930103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);