// D4-17: 执行操作拦截
import { loadSafety } from '../_helper.mjs';
const { classifyHcloudArgs } = await loadSafety();

const execOps = [['ECS','StartServers'],['ECS','RebootServers'],['ECS','StopServers'],['FunctionGraph','InvokeFunction'],['DDS','RestartInstance'],['CCE','StartCluster']];
let allDenied = true;
const details = [];
for (const [s,o] of execOps) { const r=classifyHcloudArgs([s,o]); details.push({op:`${s} ${o}`,d:r.decision,r:r.risk}); if(r.decision!=='deny')allDenied=false; }
const allowed = classifyHcloudArgs(['ECS','StartServers'],{allowWrites:true});
const ok = allDenied && allowed.decision==='allow';
console.log(JSON.stringify({status:ok?'PASS':'FAIL',caseId:'D4-17',why:`allDenied=${allDenied}, allowWithFlag=${allowed.decision}`,executedAt:'20261001103000',details},null,2));