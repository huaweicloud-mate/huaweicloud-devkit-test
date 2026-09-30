// Probe: D2-4
// Status: PASS
// Time: 20260919051059
// Detail: Redacted: no redactString
Contains AK: false
Contains SK: false
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/safety-policy.mjs').href);
const testAK = 'AKIDTEST1234567890';
const testSK = 'SKTEST1234567890abcdef';
const redacted = m.redactString ? m.redactString('AK=' + testAK + ' SK=' + testSK) : 'no redactString';
console.log('Redacted: ' + redacted);
console.log('Contains AK: ' + redacted.includes(testAK));
console.log('Contains SK: ' + redacted.includes(testSK));