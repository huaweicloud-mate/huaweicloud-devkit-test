// Probe: D4-3
// Status: FAIL
// Time: 20261005051143
// Detail: plaintext secret API

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const cmds = ['hcloud csms secret-show --name mysecret', 'hcloud kms decrypt --cipher-text abc'];
for (const cmd of cmds) {
  try {
    const r = m.classifyTextCommand(cmd);
    console.log(cmd, '->', JSON.stringify(r));
  } catch(e) {
    console.log(cmd, 'ERROR:', e.message);
  }
}
