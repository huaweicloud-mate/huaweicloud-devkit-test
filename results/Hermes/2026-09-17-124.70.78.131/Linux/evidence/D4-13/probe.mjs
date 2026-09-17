// D4-13 最小权限凭证通过率（Hermes Linux 2026-09-16）
// 用只读子账号 test001（credentials.readonly.json）实测：
//   ① 建 KooCLI profile=test001（hcloud 只读 KooCLI config，HW_* env 不落 hcloud 子进程）
//   ② 只读命令（ECS/VPC/EVS/IMS/CES/EIP 等）逐一执行，记录可用/被拒
//   ③ 写命令（VPC CreateVpc 最小规格）执行，观察权限识别（应 IAM 拒绝）
//   ④ 清理 profile 并恢复 default
// 注意：本脚本不写 credentials.json、不落盘 AK/SK 到仓库日志。
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const RO = '/home/testbot2/.config/huaweicloud/credentials.readonly.json';
const creds = JSON.parse(fs.readFileSync(RO, 'utf8'));
const AK = creds.ak, SK = creds.sk;

const redact = (s) => String(s)
  .replace(new RegExp(AK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'HPUA***REDACTED***')
  .replace(/(HPUA|AKIA|ASIA)[A-Za-z0-9]{12,}/g, '$1***REDACTED***')
  .replace(/("(?:sk|secretKey|securityToken|secretAccessKey|accessKey)"\s*[:=]\s*")[^"]+(")/gi, '$1***$2');

function run(cmd) {
  try {
    const r = execSync(cmd, { encoding: 'utf8', shell: '/bin/bash', timeout: 45000 });
    return { code: 0, out: r };
  } catch (e) {
    return { code: e.status ?? -1, out: (e.stdout || '') + (e.stderr || '') };
  }
}

const out = [];
function record(name, ok, detail) {
  out.push({ name, ok, detail: redact(JSON.stringify(detail).slice(0, 500)) });
  console.log(`[${ok ? 'OK' : 'DENY/FAIL'}] ${name}`);
}

// ① 建 profile
run(`hcloud configure set --cli-profile=test001 --cli-access-key=${AK} --cli-secret-key=${SK} --cli-region=cn-north-4`);

const P = '--cli-profile=test001';
const REGION = 'cn-north-4';

// ② 只读命令逐一执行（判断"只读是否可用"）
const reads = [
  ['ECS', 'NovaListServers'],
  ['VPC', 'ListVpcs'],
  ['EVS', 'ListVolumes'],
  ['IMS', 'ListImages'],
  ['CES', 'ListMetrics'],
  ['EIP', 'ListPublicips'],
];
let readOk = 0, readTotal = reads.length;
for (const [svc, op] of reads) {
  const r = run(`hcloud ${P} ${svc} ${op} --cli-region=${REGION} --cli-output=json`);
  const denied = /not authorized|Policy doesn|no sufficient|403|EVS\.1027|IMG\.0026|SYS\.0403|forbidden/i.test(r.out);
  const ok = r.code === 0 && !denied;
  if (ok) readOk++;
  record(`只读 ${svc} ${op}`, ok, { code: r.code, denied, out: r.out.slice(0, 220) });
}

// ③ 写命令（VPC CreateVpc 最小规格）
const vpcName = 'tctest-ro-probe-' + Date.now().toString(36).slice(-6);
const w = run(`hcloud ${P} VPC CreateVpc --cli-region=${REGION} --vpc.name=${vpcName} --vpc.cidr=192.168.90.0/24`);
const writeDenied = /not authorized|Policy doesn|policy|403|forbidden|VPC\.0010|PolicyNotAuthorized|disallowed/i.test(w.out);
record('写 VPC CreateVpc (最小规格)', writeDenied, { code: w.code, out: w.out.slice(0, 260) });

// 剩余资源核实
const residual = run(`hcloud ${P} VPC ListVpcs --cli-region=${REGION} --cli-output=json`);
const created = residual.out.includes(vpcName);
record('归零核实: 未创建任何 VPC', !created, { created });

// ④ 清理 profile 恢复 default
run('hcloud configure set --cli-profile=default --cli-region=cn-north-4');
run('hcloud configure delete --cli-profile=test001 --cli-custom=false');

// 汇总
const summary = {
  generatedAt: new Date().toISOString(),
  readAvailable: `${readOk}/${readTotal}`,
  readPassRate: `${(readOk / readTotal * 100).toFixed(0)}%`,
  writeDenied: writeDenied,
  residualZero: !created,
  conclusion: `只读可用 ${readOk}/${readTotal}（期望 100%），写操作 IAM 拒绝=${writeDenied}（期望 true），归零=${!created}`,
  results: out,
};
console.log('\n=====SUMMARY=====');
console.log(JSON.stringify(summary, null, 2));