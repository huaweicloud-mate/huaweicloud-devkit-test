// Probe: D4-5
// Status: PASS
// Time: 20261005051143
// Detail: write op detection

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const cmds = ['hcloud ecs servers create', 'hcloud vpc vpcs create'];
for (const cmd of cmds) {
  try {
    const r = m.classifyTextCommand(cmd);
    console.log(cmd, '->', JSON.stringify(r));
  } catch(e) {
    console.log(cmd, 'ERROR:', e.message);
  }
}
