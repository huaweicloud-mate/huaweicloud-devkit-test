// Probe: D3-B3
// Status: PASS
// Time: 20261005051143
// Detail: run_readonly redact

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const r = m.redactSecrets('AK=AKID123 SK=SK123');
console.log('redacted:', r);
