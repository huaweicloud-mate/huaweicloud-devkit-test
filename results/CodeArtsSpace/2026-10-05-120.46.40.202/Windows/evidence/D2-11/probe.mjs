// Probe: D2-11
// Status: FAIL
// Time: 20261005051143
// Detail: STS token reject (not blocked)

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const cmds = ['hcloud iam sts get-token', 'hcloud sts get-token'];
for (const cmd of cmds) {
  try {
    const r = m.classifyTextCommand(cmd);
    console.log(cmd, '->', JSON.stringify(r));
  } catch(e) {
    console.log(cmd, 'ERROR:', e.message);
  }
}
