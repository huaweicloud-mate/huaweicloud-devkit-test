// D3-C4 服务矩阵：22 服务只读规划(list_operations + plan 只读) + 高危轻量创建释放(最小 VPC)
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const SERVICES = [
  ['ECS','ListServersDetails'], ['VPC','ListVpcs'], ['OBS','ls'], ['RDS','ListInstances'],
  ['GaussDB','ListGaussDbInstances'], ['CCE','ListClusters'], ['FunctionGraph','ListFunctions'],
  ['IAM','KeystoneListUsers'], ['CTS','ListTrackers'], ['CES','ListAlarmTemplates'],
  ['DDS','ListInstances'], ['DCS','ListInstances'], ['SMN','ListTopics'], ['DMS','ListInstances'],
  ['WAF','ListInstance'], ['CDN','ListDomains'], ['ModelArts','ListNotebooks'], ['DEW','ListSecrets'],
  ['CBR','ListVaults'], ['EVS','ListVolumes'], ['EIP','ListPublicips'], ['ELB','ListLoadbalancers'],
];

let planOK = 0, listOK = 0;
for (const [svc, op] of SERVICES) {
  const list = await callTool('huaweicloud_list_operations', { service: svc, timeoutMs: 60000 });
  const listGood = list.service === svc && (list.result?.exitCode === 0 || !!list.result?.ok);
  if (listGood) listOK++;
  const p = await callTool('huaweicloud_plan_cli_command', { args: [svc, op] });
  const d = p.classification?.decision;
  const r = p.classification?.risk;
  if (d === 'allow') planOK++;
  console.log(`${svc.padEnd(14)} list=${listGood?'ok':'FAIL'} plan=${d}/${r}`);
}
console.log(`只读规划: list_operations ${listOK}/${SERVICES.length} 可用; plan 只读命令 ${planOK}/${SERVICES.length} 判 allow`);

// 高危轻量创建释放：最小 VPC（免费）→ 计数 → CTS 用 → 删除归零
const ts = Date.now();
const vpcName = `tctest-dsh-c4-${ts}`;
const hc = (args) => spawnSync('hcloud', [...args, '--cli-region=cn-north-4'], { shell:false, stdio:'pipe', timeout:60000 });
const j = (r) => { try { return JSON.parse((r.stdout||'').toString().slice((r.stdout||'').toString().indexOf('{'))); } catch { return null; } };

const before = j(hc(['VPC','ListVpcs']));
const beforeCount = (before?.vpcs||[]).filter(v => String(v.name||'').startsWith('tctest-dsh-')).length;
console.log('创建前 tctest-dsh- VPC 计数:', beforeCount);

const create = hc(['VPC','CreateVpc','--vpc.name='+vpcName,'--vpc.cidr=10.251.0.0/16']);
const cj = j(create);
const vpcId = cj?.vpc?.id || '';
console.log('创建 VPC:', vpcName, '| id:', vpcId, '| exit:', create.status);

const after = j(hc(['VPC','ListVpcs']));
const afterCount = (after?.vpcs||[]).filter(v => String(v.name||'').startsWith('tctest-dsh-')).length;
console.log('创建后 tctest-dsh- VPC 计数:', afterCount, '（含本次 if +1）');

// 删除归零
const del = hc(['VPC','DeleteVpc','--vpc_id='+vpcId]);
console.log('删除 VPC exit:', del.status, '| 响应:', (del.stdout||'').toString().replace(/\s+/g,' ').slice(0,120));
const fin = j(hc(['VPC','ListVpcs']));
const finCount = (fin?.vpcs||[]).filter(v => String(v.name||'').startsWith('tctest-dsh-')).length;
console.log('删除后 tctest-dsh- VPC 计数:', finCount, '（归零验证）');

const passed = planOK === SERVICES.length && listOK === SERVICES.length && vpcId && finCount === 0;
console.log('VERDICT', passed ? 'PASS' : 'FAIL');
process.exit(passed ? 0 : 1);
