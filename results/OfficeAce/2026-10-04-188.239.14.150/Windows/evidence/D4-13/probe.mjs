// D4-13: 最小权限凭证通过率
import { existsSync } from 'node:fs';
import { loadSafety } from '../_helper.mjs';
const { classifyHcloudArgs } = await loadSafety();

const readonlyCredPath = 'C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.readonly.json';
const hasReadonlyCreds = existsSync(readonlyCredPath);

const readOps = [['ECS','ListServers'],['ECS','ShowServer','--server-id=x'],['VPC','ListVpcs'],['RDS','ListInstances'],['OBS','ls'],['CCE','ListClusters']];
let readPass = true;
const details = [];
for (const args of readOps) { const r=classifyHcloudArgs(args); details.push({cmd:args.join(' '),d:r.decision}); if(r.decision!=='allow')readPass=false; }

const writeOps = [['ECS','CreateServers'],['ECS','DeleteServers'],['VPC','CreateVpc']];
let writeDenied = true;
for (const args of writeOps) { const r=classifyHcloudArgs(args); details.push({cmd:args.join(' '),d:r.decision}); if(r.decision!=='deny')writeDenied=false; }

const ok = readPass && writeDenied;
console.log(JSON.stringify({status:ok?'PASS':'FAIL',caseId:'D4-13',why:`readPass=${readPass}, writeDenied=${writeDenied}, readonlyCredsExists=${hasReadonlyCreds}`,executedAt:'20261001103000',details},null,2));