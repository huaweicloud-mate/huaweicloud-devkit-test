// D4-13 最小权限凭证通过率 — Hermes/Linux
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const { resolveCredentials } = await import(pathToFileURL(SRC + '/auth/credentials.mjs').href);
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const RO = JSON.parse(readFileSync(join(homedir(), '.config/huaweicloud/credentials.readonly.json'), 'utf8'));
const resolved = resolveCredentials({ allowMissing: true });
const roPrefix = (RO.ak || '').slice(0, 6);
const resolvedPrefix = (resolved?.ak || '').slice(0, 6);
console.log('只读 test001 ak 前缀:', roPrefix);
console.log('resolveCredentials 返回 ak 前缀:', resolvedPrefix);
console.log('run-as-readonly 动态切换生效:', resolvedPrefix === roPrefix);

function hcloudRO(args) {
  return spawnSync('hcloud', [...args, '--cli-region=cn-north-4', '--cli-access-key=' + RO.ak, '--cli-secret-key=' + RO.sk], { shell: false, stdio: 'pipe', timeout: 30000 });
}
const write = hcloudRO(['VPC', 'CreateVpc', '--vpc.name=tctest-hermes-d413', '--vpc.cidr=10.251.0.0/16']);
const wout = ((write.stdout || '') + '' + (write.stderr || '')).toString();
const writeDenied = /PolicyNotAuthorized|disallowed by policy|SYS\.0403|Pdp\.0001|not authorized|Policy doesn't allow|VPC\.0010/i.test(wout);
const notAuthError = !/APIGW\.0301|Invalid AK\/SK|invalid access key/i.test(wout);
console.log('写(VPC CreateVpc) exit:', write.status);
console.log('写被拒绝(权限不足):', writeDenied);
console.log('凭证可认证(非 APIGW.0301):', notAuthError);
console.log('写响应:', wout.replace(/\s+/g, ' ').slice(0, 200));

const reads = [['ECS', 'ListServersDetails'], ['VPC', 'ListVpcs'], ['CTS', 'ListTrackers'], ['CES', 'ListAlarmTemplates'], ['IMS', 'ListImages']];
let readOK = 0;
for (const [svc, op] of reads) {
  const p = await callTool('huaweicloud_plan_cli_command', { args: [svc, op] });
  const ok = p.classification?.decision === 'allow';
  if (ok) readOK++;
  console.log(`  只读规划 ${svc} ${op} -> ${p.classification?.decision}/${p.classification?.risk}`);
}
console.log('只读规划可用:', readOK, '/', reads.length);

const pass = (resolvedPrefix === roPrefix) && writeDenied && notAuthError && readOK === reads.length;
console.log('=== 结论 ===');
console.log('切换生效(应 true):', resolvedPrefix === roPrefix);
console.log('写被 IAM 拒绝(应 true):', writeDenied);
console.log('D4-13 最小权限通过率(全 true=PASS):', pass);