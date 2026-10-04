// Probe: D2-4
// Status: PASS
// Time: 20261005051143
// Detail: credential redaction

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const testAK = 'AKIDTEST1234567890';
const testSK = 'SKTEST1234567890abcdef';
const input1 = 'AK=' + testAK + ' SK=' + testSK;
const r1 = m.redactSecrets(input1);
console.log('Upper redacted:', r1);
console.log('Upper leak AK:', r1.includes(testAK));
console.log('Upper leak SK:', r1.includes(testSK));
const input2 = 'ak=' + testAK + ' sk=' + testSK;
const r2 = m.redactSecrets(input2);
console.log('Lower redacted:', r2);
console.log('Lower leak AK:', r2.includes(testAK));
console.log('Lower leak SK:', r2.includes(testSK));
