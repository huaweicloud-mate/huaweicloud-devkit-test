// D4-13 (P1): 最小权限凭证通过率 — 只读 IAM 子账号（test001）实测
// 用法（由 run-as-readonly.py 注入只读 HW_ACCESS_KEY/HW_SECRET_KEY env 后运行）:
//   python scripts/run-as-readonly.py node evidence/D4-13/probe.mjs
// 断言: 只读命令 100% 可用，写命令被 IAM 正确拒绝（权限不足）。
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const REGION = process.env.HW_REGION || 'cn-north-4';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 160), expected: String(expected) });
}
function sh(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 90000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const DENY = /denied|forbidden|无权限|403|insufficient|not authorized|NoPermission|您没有|权限不足|not have permission/i;

// ---- 只读命令（KooCLI 用 --key=value 格式）----
const ro1 = sh(['ECS', 'ListServers', `--cli-region=${REGION}`, '--limit=1']);
const ro1ok = ro1.code === 0 && !DENY.test(ro1.out) && !/USE_ERROR/i.test(ro1.out);
test('D4-13', 'readonly-ListServers', ro1ok, `exit=${ro1.code} ${ro1.out.slice(0,100)}`, 'exit0+无权限拒绝+非参数错误');

const ro2 = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`, '--limit=1']);
const ro2ok = ro2.code === 0 && !DENY.test(ro2.out) && !/USE_ERROR/i.test(ro2.out);
test('D4-13', 'readonly-ListVpcs', ro2ok, `exit=${ro2.code} ${ro2.out.slice(0,100)}`, 'exit0+无权限拒绝+非参数错误');

// ---- 写命令：完整参数使其抵达 IAM，只读子账号应被 IAM 拒绝 ----
const wr = sh(['VPC', 'CreateVpc', `--cli-region=${REGION}`, '--vpc.name=hdk-ro-probe', '--vpc.cidr=10.99.0.0/16']);
const wrDenied = wr.code !== 0 && DENY.test(wr.out) && !/USE_ERROR/i.test(wr.out);
test('D4-13', 'write-iam-denied', wrDenied, `exit=${wr.code} ${wr.out.slice(0,140)}`, 'IAM拒绝(权限不足)');

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-17-1.94.218.129/Linux/evidence/D4-13/stdout.log'), output, 'utf8');
console.log(output);