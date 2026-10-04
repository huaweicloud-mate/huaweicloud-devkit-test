// Probe: D2-16
// Status: FAIL
// Time: 20261005051143
// Detail: import file read

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const cmd = 'hcloud iam configure import --file credentials.json';
try {
  const r = m.classifyTextCommand(cmd);
  console.log('import --file ->', JSON.stringify(r));
} catch(e) {
  console.log('ERROR:', e.message);
}
