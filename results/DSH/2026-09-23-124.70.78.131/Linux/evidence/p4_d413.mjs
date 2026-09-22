// D4-13 最小权限凭证通过率（readonly test001：env 注入动态切换 + 写被 IAM 拒绝 + 只读通过率）
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { add, flush, CORE } from './_util.mjs';
const { resolveCredentials } = await import(CORE + '/auth/credentials.mjs');
const { callTool } = await import(CORE + '/tools.mjs');

const RO = JSON.parse(readFileSync(join(homedir(), '.config/huaweicloud/credentials.readonly.json'), 'utf8'));
const roPrefix = (RO.ak || '').slice(0, 6);

// 1. 默认（无 env 注入）resolveCredentials 读管理员 S1
const base = resolveCredentials({ allowMissing: true });
const basePrefix = (base?.ak || '').slice(0, 6);
add('D4-13', '默认 resolveCredentials 读管理员凭证', !!basePrefix, 'akPrefix=' + basePrefix);

// 2. run-as-readonly 等价 env 注入（AK/SK 无 token）→ 动态切换到只读子账号
{
  const env = { ...process.env, HW_ACCESS_KEY: RO.ak, HW_SECRET_KEY: RO.sk };
  delete env.HW_SECURITY_TOKEN;
  const sub = spawnSync(process.execPath, ['--input-type=module', '-e',
    `const {resolveCredentials}=await import('${CORE}/auth/credentials.mjs'); const r=resolveCredentials({allowMissing:true}); console.log((r&&r.ak)||'')`],
    { env, encoding: 'utf8', timeout: 20000 });
  const switchAk = (sub.stdout || '').trim();
  add('D4-13', 'env 注入只读 AK/SK 动态切换只读子账号', switchAk === RO.ak, 'resolvedPrefix=' + switchAk.slice(0, 6) + ' 期望=' + roPrefix);
}

// 3. 只读子账号直连写 → IAM 应拒绝(权限不足，非无效凭证)
const hcRO = (args) => spawnSync('hcloud', [...args, '--cli-region=cn-north-4', '--cli-access-key=' + RO.ak, '--cli-secret-key=' + RO.sk], { shell: false, encoding: 'utf8', timeout: 30000 });
const write = hcRO(['VPC', 'CreateVpc', '--vpc.name=tctest-dsh-d413', '--vpc.cidr=10.246.0.0/16']);
const wout = String(write.stdout || '') + String(write.stderr || '');
const writeDenied = /PolicyNotAuthorized|disallowed by policy|not authorized|Policy doesn't allow|VPC\.0010|Pdp/i.test(wout);
const notAuthErr = !/APIGW\.0301|Invalid AK\/SK|invalid access key/i.test(wout);
add('D4-13', '只读子账号写被 IAM 拒绝(权限不足)', writeDenied && notAuthErr, wout.replace(/\s+/g, ' ').slice(0, 180));

// 4. 只读子账号只读规划 5/5（客户端只读分类，全部 allow）
const reads = [['ECS', 'ListServersDetails'], ['VPC', 'ListVpcs'], ['CTS', 'ListTrackers'], ['CES', 'ListAlarmTemplates'], ['IMS', 'ListImages']];
let readOK = 0;
for (const [svc, op] of reads) {
  const p = await callTool('huaweicloud_plan_cli_command', { args: [svc, op] }).catch(() => null);
  if (p && p.classification && p.classification.decision === 'allow') readOK++;
}
add('D4-13', '只读子账号只读规划 5/5 可用(客户端分类 allow)', readOK === 5, readOK + '/5');
// 5. 只读子账号真机直连读（写已证拒；读为参考项：部分服务需显式 project-id 才能解析）
const rrVpc = hcRO(['VPC', 'ListVpcs']);
add('D4-13', '只读子账号真机 ListVpcs 可达(写拒/读可达)', rrVpc.status === 0, 'exit=' + rrVpc.status);

flush();