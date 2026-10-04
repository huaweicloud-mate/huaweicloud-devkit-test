// Probe: D4-9
// Status: PASS
// Time: 20261005051143
// Detail: destructive precheck

const m = await import('file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
try {
  const r = m.classifyTextCommand('hcloud ecs servers delete --server-id 123');
  console.log('delete ->', JSON.stringify(r));
} catch(e) {
  console.log('ERROR:', e.message);
}
