#!/usr/bin/env node
// D4-13 最小权限凭证通过率 v2 (OpenClaw Linux 2026-10-17)
// 修正 v1 归类 bug：旧探针以 /\b403\b/ 判拒绝，误把 CES 指标维度里的 value="403" 当成被拒。
// v2 判定拒绝只看「API 层错误码/权限错误」，不再把指标 payload 中的数字当拒绝。
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const RO = '/home/testbot1/.config/huaweicloud/credentials.readonly.json';
const creds = JSON.parse(fs.readFileSync(RO, 'utf8'));
const AK = creds.ak, SK = creds.sk;

const redact = (s) => String(s)
  .replace(new RegExp(AK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'HPUA***REDACTED***')
  .replace(/(HPUA|AKIA|ASIA)[A-Za-z0-9]{12,}/g, '$1***REDACTED***');

function run(cmd) {
  try {
    const r = execSync(cmd, { encoding: 'utf8', shell: '/bin/bash', timeout: 45000, maxBuffer: 10 * 1024 * 1024 });
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

run(`hcloud configure set --cli-profile=test001 --cli-access-key=${AK} --cli-secret-key=${SK} --cli-region=cn-north-4`);
const P = '--cli-profile=test001';
const REGION = 'cn-north-4';

// API 层权限错误：只看顶层 error.code 或明确的权限拒绝文案，不看 metrics payload 里的业务值
function apiDenied(out) {
  if (/PolicyNotAuthorized|Policy doesn't allow|no sufficient permission|not authorized|forbidden/i.test(out)) return true;
  // 顶层 API 错误体（非指标列表 payload）
  if (/"code"\s*:\s*"(Common\.0013|APIGW\.\d+|EVS\.1027|IMG\.0026|SYS\.0403|VPC\.\d{4})"/.test(out)) return true;
  return false;
}

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
  const denied = apiDenied(r.out);
  const ok = r.code === 0 && !denied;
  if (ok) readOk++;
  record(`只读 ${svc} ${op}`, ok, { code: r.code, denied, head: r.out.slice(0, 120) });
}

const vpcName = 'tctest-ro-probe-' + Date.now().toString(36).slice(-6);
const w = run(`hcloud ${P} VPC CreateVpc --cli-region=${REGION} --vpc.name=${vpcName} --vpc.cidr=192.168.90.0/24`);
const writeDenied = apiDenied(w.out);
record('写 VPC CreateVpc (最小规格)', writeDenied, { code: w.code, head: w.out.slice(0, 200) });

const residual = run(`hcloud ${P} VPC ListVpcs --cli-region=${REGION} --cli-output=json`);
const created = residual.out.includes(vpcName);
record('归零核实: 未创建任何 VPC', !created, { created });

run('hcloud configure set --cli-profile=default --cli-region=cn-north-4');
run('hcloud configure delete --cli-profile=test001 --cli-custom=false');

const summary = {
  generatedAt: new Date().toISOString(),
  readAvailable: `${readOk}/${readTotal}`,
  readPassRate: `${(readOk / readTotal * 100).toFixed(0)}%`,
  writeDenied,
  residualZero: !created,
  conclusion: `只读可用 ${readOk}/${readTotal}（期望 100%），写操作 IAM 拒绝=${writeDenied}（期望 true），归零=${!created}`,
  results: out,
};
console.log('\n=====SUMMARY=====');
console.log(JSON.stringify(summary, null, 2));