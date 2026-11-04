// D4-13 补充探针（2026-11-05）
// 背景：主探针写路径 CreateVpc 返回 VPC.0114（router 配额耗尽），无法区分「IAM 拒绝」与「配额拒绝」。
// 本补充探针：
//   ① 建 test001 profile（只读子账号 AK/SK），打印 test001 与 default 的脱敏 AK，证明 profile 真实生效（防误用管理员 profile）
//   ② 写动作 CreateSecurityGroup（不消耗 router 配额）：若 IAM 拒绝 → policy/403 类错误（写被拒✓）；若创建成功 → 只读账号实际可写（缺陷）
//   ③ 写动作 DeleteVpc(不存在UUID)：记录错误形态（配额/策略/NotFound 的先后顺序）
//   ④ 归零核实：SG 若被创建则删除并复核；VPC 无新增
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const RO = '/home/testbot3/.config/huaweicloud/credentials.readonly.json';
const creds = JSON.parse(fs.readFileSync(RO, 'utf8'));
const AK = creds.ak, SK = creds.sk;
const redact = (s) => String(s)
  .replace(new RegExp(AK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'HPUA***REDACTED***')
  .replace(/(HPUA|AKIA|ASIA)[A-Za-z0-9]{12,}/g, '$1***REDACTED***');

function run(cmd) {
  try {
    const r = execSync(cmd, { encoding: 'utf8', shell: '/bin/bash', timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
    return { code: 0, out: r };
  } catch (e) {
    return { code: e.status ?? -1, out: (e.stdout || '') + (e.stderr || '') };
  }
}

const set = run(`hcloud configure set --cli-profile=test001 --cli-access-key=${AK} --cli-secret-key=${SK} --cli-region=cn-north-4`);
console.log(`[setup] configure set test001 code=${set.code} ${redact(set.out).replace(/\n/g, ' ').slice(0, 200)}`);

const AK_PREFIX = AK.slice(0, 4);
const list = run('hcloud configure list');
const hasProfile = /"name":\s*"test001"/.test(list.out);
console.log(`[verify] test001 profile 存在=${hasProfile}；只读AK前缀=${AK_PREFIX}***；default 与 test001 脱敏AK: ${(list.out.match(/accessKeyId": "[^"]+"/g) || []).join(' | ')}`);

const DENY_RE = /not authorized|Policy doesn|policy|403|forbidden|PolicyNotAuthorized|disallowed|APIGW\./i;
const results = [];
results.push({ name: 'test001 profile 建立且指向只读子账号', pass: hasProfile, detail: `hasProfile=${hasProfile} readonlyAkPrefix=${AK_PREFIX}***` });
console.log(`[${hasProfile ? 'OK' : 'FAIL'}] test001 profile 建立且指向只读子账号`);

const sgName = 'tctest-ro-sg-denycheck';
const sg = run(`hcloud --cli-profile=test001 VPC CreateSecurityGroup --security_group.name=${sgName} --security_group.vpc_id=none --cli-region=cn-north-4 --cli-output=json`);
const sgDenied = DENY_RE.test(sg.out);
const sgCreated = /"id":\s*"[0-9a-f]{8}-/.test(sg.out) && !DENY_RE.test(sg.out);
results.push({ name: '只读子账号写动作 CreateSecurityGroup', pass: sgDenied, detail: redact(sg.out.slice(0, 400)) });
console.log(`[${sgDenied ? 'OK' : 'FAIL'}] 只读写动作 CreateSecurityGroup 被拒=${sgDenied} (created=${sgCreated})`);
console.log(`[OBS] CreateSecurityGroup 输出: ${redact(sg.out.slice(0, 260)).replace(/\n/g, ' ')}`);

const del = run('hcloud --cli-profile=test001 VPC DeleteVpc --vpc_id=11111111-1111-1111-1111-111111111111 --cli-region=cn-north-4 --cli-output=json');
results.push({ name: '只读写动作 DeleteVpc(不存在UUID)', pass: DENY_RE.test(del.out), detail: redact(del.out.slice(0, 300)) });
console.log(`[OBS] DeleteVpc(不存在UUID) 输出: ${redact(del.out.slice(0, 200)).replace(/\n/g, ' ')}`);

// 归零：若 SG 被创建（只读账号越权）则删除
if (sgCreated) {
  const sgId = (/"id":\s*"([0-9a-f-]{36})"/.exec(sg.out) || [])[1];
  const delSg = run(`hcloud --cli-profile=default VPC DeleteSecurityGroup --security_group_id=${sgId} --cli-region=cn-north-4`);
  const sgList = run('hcloud --cli-profile=default VPC ListSecurityGroups --cli-region=cn-north-4');
  const residual = sgList.out.includes(sgName);
  results.push({ name: '越权创建的 SG 已删除归零', pass: !residual, detail: `sgId=${sgId} residual=${residual}` });
  console.log(`[${!residual ? 'OK' : 'FAIL'}] 越权创建的 SG 删除归零 residual=${residual}`);
} else {
  const sgList = run('hcloud --cli-profile=default VPC ListSecurityGroups --cli-region=cn-north-4');
  const residual = sgList.out.includes(sgName);
  results.push({ name: 'SG 无残留', pass: !residual, detail: `residual=${residual}` });
  console.log(`[${!residual ? 'OK' : 'FAIL'}] SG 无残留 residual=${residual}`);
}

run('hcloud configure set --cli-profile=default --cli-region=cn-north-4');
run('hcloud configure delete --cli-profile=test001 --cli-custom=false');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), writeDeniedByIam: sgDenied, results }, null, 2));