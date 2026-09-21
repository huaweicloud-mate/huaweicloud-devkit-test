/**
 * OpenCode 1.1.4 正式版 C4 服务矩阵探针
 */
import { callTool } from 'file:///home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';

const services = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];
const results = [];

for (const svc of services) {
  try {
    const r = await callTool('huaweicloud_list_operations', { service: svc });
    const ok = !r.isError && JSON.stringify(r).length > 10;
    results.push({ service: svc, pass: ok, actual: ok ? 'ok' : 'fail' });
  } catch(e) {
    results.push({ service: svc, pass: false, actual: String(e).substring(0,80) });
  }
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results }, null, 2);
writeFileSync('/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-22-113.44.143.91/Linux/evidence/c4-service-matrix/stdout.log', output, 'utf8');
console.log(output);
