import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
const r1 = planHcloudCommand(['VPC','CreateSecurityGroupRule','--direction=ingress','--port_range_min=22','--protocol=tcp','--remote_ip_prefix=0.0.0.0/0'], {allowWrites:true});
const r2 = classifyHcloudArgs(['ECS','DeleteServers','--servers=all']);
console.log(JSON.stringify({pub: r1.classification, dest: r2}, null, 2));