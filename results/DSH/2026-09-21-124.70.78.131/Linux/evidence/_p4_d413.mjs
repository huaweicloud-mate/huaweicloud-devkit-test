// D4-13 最小权限凭证通过率（readonly test001 直连，写被 IAM 拒绝 + resolveCredentials 切换判定）
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { add, flush, CORE } from './_util.mjs';
const { resolveCredentials } = await import(CORE + '/auth/credentials.mjs');
const { callTool } = await import(CORE + '/tools.mjs');

const RO = JSON.parse(readFileSync(join(homedir(), '.config/huaweicloud/credentials.readonly.json'), 'utf8'));
const roPrefix = (RO.ak || '').slice(0, 6);
const resolved = resolveCredentials({ allowMissing: true });
const resolvedPrefix = (resolved?.ak || '').slice(0, 6);
add('D4-13', 'resolveCredentials 切到只读子账号(HPUA3X)', resolvedPrefix === roPrefix, 'resolved=' + resolvedPrefix + ' 期望=' + roPrefix);

// 只读子账号直连写 → IAM 应拒绝(权限不足，非无效凭证)
const hcRO = (args) => spawnSync('hcloud', [...args, '--cli-region=cn-north-4', '--cli-access-key=' + RO.ak, '--cli-secret-key=' + RO.sk], { shell: false, encoding: 'utf8', timeout: 30000 });
const write = hcRO(['VPC', 'CreateVpc', '--vpc.name=tctest-dsh-d413', '--vpc.cidr=10.246.0.0/16']);
const wout = String(write.stdout || '') + String(write.stderr || '');
const writeDenied = /PolicyNotAuthorized|disallowed by policy|not authorized|Policy doesn't allow|VPC\.0010|Pdp/i.test(wout);
const notAuthErr = !/APIGW\.0301|Invalid AK\/SK|invalid access key/i.test(wout);
add('D4-13', '只读子账号写被 IAM 拒绝(权限不足)', writeDenied && notAuthErr, wout.replace(/\s+/g, ' ').slice(0, 160));

// 只读规划抽样 100% 可用
const reads = [['ECS', 'ListServersDetails'], ['VPC', 'ListVpcs'], ['CTS', 'ListTrackers'], ['CES', 'ListAlarmTemplates'], ['IMS', 'ListImages']];
let readOK = 0;
for (const [svc, op] of reads) {
  const p = await callTool('huaweicloud_plan_cli_command', { args: [svc, op] }).catch(() => null);
  if (p && p.classification && p.classification.decision === 'allow') readOK++;
}
add('D4-13', '只读规划 5/5 可用', readOK === 5, readOK + '/5');

flush();