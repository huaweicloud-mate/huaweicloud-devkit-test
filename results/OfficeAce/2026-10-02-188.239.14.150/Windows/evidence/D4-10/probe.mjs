// D4-10: Shell包装拦截
import { loadSafety } from '../_helper.mjs';
const { classifyTextCommand } = await loadSafety();

const vectors = [
  'bash -c "hcloud ECS DeleteServers --server-ids=xxx"',
  'sh -c "hcloud ECS DeleteServers"',
  'cmd /c "hcloud ECS DeleteServers --server-ids=xxx"',
  'powershell -Command "hcloud ECS DeleteServers"',
  'sudo hcloud ECS DeleteServers',
  'eval "hcloud ECS DeleteServers"',
];
let allDenied = true;
const details = [];
for (const cmd of vectors) { const r=classifyTextCommand(cmd); details.push({cmd,d:r.decision,r:r.risk}); if(r.decision!=='deny')allDenied=false; }
console.log(JSON.stringify({status:allDenied?'PASS':'FAIL',caseId:'D4-10',why:allDenied?'All shell-wrapped writes denied.':'Some not denied.',executedAt:'20261001103000',details},null,2));