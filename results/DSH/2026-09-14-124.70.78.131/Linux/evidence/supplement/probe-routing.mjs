// DSH/Linux — serviceCatalog routing (D10-3) + doc drift (D8-1)
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { callTool, TOOL_DEFINITIONS } = await import(CORE + '/tools.mjs');
import { readFileSync } from 'node:fs';
const results=[];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}

// D8-1 doc drift: tools.mjs count vs source AGENTS.md
const N = TOOL_DEFINITIONS.length;
let doc='';
try { doc = readFileSync('/home/testbot2/devkit-test/DSH/hdk/AGENTS.md','utf8'); } catch(e){}
const docSays39 = /39 (tools|MCP tool)/.test(doc);
check('D8-1',`source AGENTS.md still says 39 while tools.mjs=${N}`, !(N===40 && docSays39), `N=${N} doc39=${docSays39}`);

// D10-3 serviceCatalog Chinese intent routing
const intents = [
  ['ECS-机房','帮我查华北北京四的云主机', /ecs/i],
  ['RDS-MySQL','云数据库MySQL', /rds/i],
  ['ECS-2C4G','创建 2C4G 的 Ubuntu 云服务器', /ecs/i],
  ['EIP','绑定弹性IP', /eip|vpc/i],
  ['OBS-site','部署公网静态网站', /obs|website/i],
  ['CBR-backup','每日备份策略', /cbr|backup/i],
  ['Redis','Redis 缓存', /dcs/i],
  ['K8s','Kubernetes 集群', /cce/i],
];
let hit=0, miss=0;
const missList=[];
for (const [label, q, re] of intents) {
  let r=null,err=null;
  try { r = await callTool('huaweicloud_service_catalog', { intent: q }); } catch(e){ err=e; }
  const text = JSON.stringify(r);
  const ok = !err && re.test(text);
  if (ok) hit++; else { miss++; missList.push(label); }
  check('D10-3', `intent "${label}" (${q}) routed`, ok, err?`err=${err.message}`:text.slice(0,120));
}
check('D10-3', `${hit}/${intents.length} Chinese intents routed`, miss===0, `${hit}/${intents.length} hit, miss=[${missList.join(',')}]`);

const failed=results.filter(r=>!r.pass);
console.log('=== ROUTING/DOC PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('\nFAILED:');for(const r of failed)console.log(`  ${r.id} ${r.name}`);process.exit(1);}
console.log('\nALL ROUTING ASSERTIONS PASSED');
