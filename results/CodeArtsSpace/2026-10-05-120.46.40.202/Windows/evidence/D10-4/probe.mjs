// Probe: D10-4
// Status: PASS
// Time: 20261005051143
// Detail: safety intervention static rule

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
try {
  const r = m.classifyTextCommand('hcloud ecs servers delete --force');
  console.log('delete --force ->', JSON.stringify(r));
} catch(e) {
  console.log('ERROR:', e.message);
}
