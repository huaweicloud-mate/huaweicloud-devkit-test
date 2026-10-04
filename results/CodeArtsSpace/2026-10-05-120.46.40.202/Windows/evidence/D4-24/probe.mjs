// Probe: D4-24
// Status: PASS
// Time: 20261005051143
// Detail: access_token redact

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const r = m.redactSecrets('access_token=abcdef123456');
console.log('access_token redacted:', r);
console.log('contains token:', r.includes('abcdef123456'));
