// D4-24: 命令拼接拦截
import { loadSafety } from '../_helper.mjs';
const { classifyTextCommand } = await loadSafety();

const vectors = [
  'hcloud ECS ListServers ; hcloud ECS DeleteServers --server-ids=xxx',
  'hcloud ECS ListServers && hcloud ECS DeleteServers --server-ids=xxx',
  'hcloud ECS ListServers || hcloud ECS DeleteServers --server-ids=xxx',
  'hcloud ECS ListServers | hcloud ECS DeleteServers --server-ids=xxx',
];
let allDenied = true;
const details = [];
for (const cmd of vectors) { const r=classifyTextCommand(cmd); details.push({cmd,d:r.decision,r:r.risk}); if(r.decision!=='deny')allDenied=false; }
console.log(JSON.stringify({status:allDenied?'PASS':'FAIL',caseId:'D4-24',why:allDenied?'All concat variants denied.':'Some not denied.',executedAt:'20260930103000',details},null,2));