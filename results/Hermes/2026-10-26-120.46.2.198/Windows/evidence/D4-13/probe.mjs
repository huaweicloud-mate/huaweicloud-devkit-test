// D4-13 最小权限凭证通过率（只读 IAM 子账号 test001）
// 通过 scripts/run-as-readonly.py 注入 HW_ACCESS_KEY/HW_SECRET_KEY env（不带 token）
// 断言：只读子账号下 READ 可用、WRITE 被 IAM 拒绝(403/无权限)
import { spawnSync } from 'node:child_process';
const ro = { ...process.env }; // run-as-readonly.py 已注入 env
const read1 = spawnSync('hcloud', ['ECS','ListServersDetails','--cli-region=cn-north-4'], { encoding:'utf8', timeout:60000 });
const read2 = spawnSync('hcloud', ['VPC','ListVpcs','--cli-region=cn-north-4'], { encoding:'utf8', timeout:60000 });
const write = spawnSync('hcloud', ['VPC','CreateVpc','--vpc.name=hdk-ro-deny-probe','--vpc.cidr=10.199.0.0/16','--cli-region=cn-north-4'], { encoding:'utf8', timeout:60000 });
const wout = ((write.stdout||'')+(write.stderr||''));
const denied = /(403|denied|Denied|forbidden|无权限|permission|Permission|AccessDenied|拒绝)/.test(wout);
const status = (read1.status===0 && read2.status===0 && denied) ? 'PASS' : 'FAIL';
console.log(JSON.stringify({ status, caseId:'D4-13', why: denied ? '只读读可用、写被 IAM 拒绝' : `写未被明确拒绝 status=${write.status}`, tests:[
  `READ ECS: status=${read1.status}`, `READ VPC: status=${read2.status}`, `WRITE CreateVpc: status=${write.status} denied=${denied}`
], executedAt:'${'20261026063000'}' }, null, 2));
