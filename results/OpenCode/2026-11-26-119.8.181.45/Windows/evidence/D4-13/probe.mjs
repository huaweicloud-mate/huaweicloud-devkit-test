// D4-13 minimal-privilege: test001 read succeeds, write must be rejected by IAM (explicit --cli-access-key to avoid KooCLI profile fallback).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
const EV = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\huaweicloud-devkit-test\results\OpenCode\2026-11-25-119.8.181.45\Windows\evidence\D4-13`;
const CASE_ID = 'D4-13';
const REG = 'cn-north-4';
const NK = (() => { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); })();
const NAME = 'tctest-ro13-' + NK.slice(4, 12);
const ro = JSON.parse(readFileSync(join(os.homedir(), '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
const admin = JSON.parse(readFileSync(join(os.homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
const flags = (c) => ['--cli-access-key=' + c.ak, '--cli-secret-key=' + c.sk, '--cli-region=' + REG];
const hc = (args, cred, timeout = 90000) => { const r = spawnSync(process.env.HCLOUD_BIN || 'hcloud', args.concat(flags(cred)), { encoding: 'utf8', timeout }); let j = null; try { j = JSON.parse((r.stdout || '').trim()); } catch {} return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim(), json: j }; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function emit(status, why, result) { const o = { caseId: CASE_ID, status, why, executedAt: NK, result }; writeFileSync(join(EV, 'stdout.log'), JSON.stringify(o, null, 2), 'utf8'); console.log(JSON.stringify({ caseId: CASE_ID, status, why })); }
async function main() {
  const read = hc(['ECS', 'ListServersDetails', '--cli-output=json'], ro);
  const readOk = read.code === 0 && read.json && read.json.count !== undefined;
  const write = hc(['VPC', 'CreateVpc', '--vpc.name=' + NAME, '--vpc.cidr=192.168.93.0/24', '--cli-output=json'], ro);
  const wtext = String(write.out || '') + JSON.stringify(write.json || {});
  const denied = /Pdp\.0001|not authorized|PolicyNotAuthorized|denied by policy|VPC\.0010|权限不足|Unauthorized|APIGW\.0301|Incorrect IAM authentication/i.test(wtext);
  const apiCode = (write.json && write.json.code) || (write.json && write.json.error && write.json.error.code) || null;
  const result = { read: { code: read.code, count: read.json && read.json.count }, write: { code: write.code, denied, apiCode, out: wtext.slice(0, 500) } };
  if (readOk && denied) emit('PASS', '最小权限子账号 test001：只读成功(count=' + read.json.count + ')，写操作被 IAM 拒绝(' + apiCode + ')，未创建资源', result);
  else if (!readOk && /APIGW\.0301|Unauthorized/i.test(String(read.out))) emit('BLOCKED', '只读子账号 test001 认证失败，最小权限通过率无法测量；解除条件：有效只读 AK/SK', result);
  else emit('FAIL', 'D4-13：只读或写拒绝语义不符（readOk=' + readOk + ' denied=' + denied + '）', result);
}
main().catch((e) => emit('FAIL', 'probe exception: ' + String(e && e.stack || e), {}));
