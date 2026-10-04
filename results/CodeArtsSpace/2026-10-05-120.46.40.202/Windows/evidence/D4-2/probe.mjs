// Probe: D4-2
// Status: FAIL
// Time: 20261005051143
// Detail: credential env print

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const cmds = ['echo $HW_ACCESS_KEY', 'echo $ACCESS_KEY', 'printenv HW_SECRET_KEY'];
for (const cmd of cmds) {
  try {
    const r = m.classifyTextCommand(cmd);
    console.log(cmd, '->', JSON.stringify(r));
  } catch(e) {
    console.log(cmd, 'ERROR:', e.message);
  }
}
