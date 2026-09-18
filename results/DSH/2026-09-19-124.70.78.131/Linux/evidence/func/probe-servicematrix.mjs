// DSH/Linux service matrix read-only planning smoke (list_operations + plan) v1.1.4
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { callTool } = await import(CORE + '/tools.mjs');
const results = [];
const SVC = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];
for (const s of SVC) {
  try {
    const lo = await callTool('huaweicloud_list_operations', {service:s});
    results.push({id:`EXP-C4-${s}`, svc:s, ok: !!lo?.result?.ok, cmd: lo?.command});
  } catch(e) {
    results.push({id:`EXP-C4-${s}`, svc:s, ok:false, cmd:'THROW '+String(e.message||e).slice(0,60)});
  }
}
let ok=0;
for (const r of results) { if (r.ok) ok++; console.log(`${r.ok?'PASS':'FAIL'}  ${r.svc.padEnd(12)} ${r.ok?'read-only planning ok':'unavailable'}  ${r.cmd}`); }
console.log(`=== SERVICE MATRIX ${ok}/${results.length} read-only planning accessible ===`);
