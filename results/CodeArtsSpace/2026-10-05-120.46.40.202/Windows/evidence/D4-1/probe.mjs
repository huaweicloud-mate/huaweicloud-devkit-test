// Probe: D4-1
// Status: PASS
// Time: 20261005051143
// Detail: credential file read

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const cmd = 'cat ~/.config/huaweicloud/credentials.json';
try {
  const r = m.classifyTextCommand(cmd);
  console.log('cat credentials ->', JSON.stringify(r));
} catch(e) {
  console.log('ERROR:', e.message);
}
