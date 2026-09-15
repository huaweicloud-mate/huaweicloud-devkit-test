import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const writeOps = [['ECS','CreateServers'],['RDS','CreateInstance'],['VPC','CreateVpc'],['ECS','DeleteServers']];
let ok = true;
for (const [s,o] of writeOps) {
  const r = classifyHcloudArgs([s,o]);
  console.log(s+' '+o+' => '+r.decision);
  if (r.decision === 'allow') { ok = false; }
}
if (ok) console.log('PASS'); else console.log('FAIL');