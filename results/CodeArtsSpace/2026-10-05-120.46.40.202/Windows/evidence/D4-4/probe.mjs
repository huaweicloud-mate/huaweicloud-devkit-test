// Probe: D4-4
// Status: FAIL
// Time: 20261005051143
// Detail: echo ACCESS_KEY

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
try {
  const r = m.classifyTextCommand('echo $ACCESS_KEY');
  console.log('echo $ACCESS_KEY ->', JSON.stringify(r));
} catch(e) {
  console.log('ERROR:', e.message);
}
