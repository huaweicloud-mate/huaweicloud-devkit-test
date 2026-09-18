// D4-13 (P1): 最小权限凭证通过率 — 只读 IAM 子账号（test001）实测
// 修正：hcloud(KooCLI) 不读 HW_ACCESS_KEY env（实证：假AK仍成功），故直接用
//   --cli-access-key/--cli-secret-key 注入只读凭证（子账号凭证来自 credentials.readonly.json）。
// 机制：只读命令应 100% 成功；写命令(CreateVpc)应被 IAM 拒绝(权限不足)。
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REGION = process.env.HW_REGION || 'cn-north-4';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected) });
}

// 读只读子账号凭证（不打印）
const roPath = join(homedir(), '.config', 'huaweicloud', 'credentials.readonly.json');
let roAk = '', roSk = '';
if (existsSync(roPath)) {
  try {
    const d = JSON.parse(readFileSync(roPath, 'utf8'));
    roAk = d.ak || ''; roSk = d.sk || '';
    if (d.region) REGION === 'cn-north-4' ? null : null;
  } catch {}
}

function sh(args) {
  // 注入只读凭证（临时凭证不落 shell 历史）
  const full = ['--cli-access-key=' + roAk, '--cli-secret-key=' + roSk, ...args];
  const r = spawnSync('hcloud', full, { encoding: 'utf8', timeout: 90000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const DENY = /denied|forbidden|无权限|403|insufficient|not authorized|NoPermission|您没有|权限不足|not have permission|Forbidden|unauthorized|PolicyNotAuthorized|disallowed by policy/i;

if (!roAk || !roSk) {
  test('D4-13', 'readonly-creds', false, '只读凭证缺失', 'credentials.readonly.json 含 ak/sk');
} else {
  // ---- 只读命令 100% 可用 ----
  const ro1 = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`, '--limit=1']);
  const ro1ok = ro1.code === 0 && !DENY.test(ro1.out) && !/USE_ERROR/i.test(ro1.out);
  test('D4-13', 'readonly-ListServersDetails', ro1ok, `exit=${ro1.code} ${ro1.out.slice(0,90)}`, 'exit0+可枚举+非参数错误');

  const ro2 = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`, '--limit=1']);
  const ro2ok = ro2.code === 0 && !DENY.test(ro2.out) && !/USE_ERROR/i.test(ro2.out);
  test('D4-13', 'readonly-ListVpcs', ro2ok, `exit=${ro2.code} ${ro2.out.slice(0,90)}`, 'exit0+可枚举+非参数错误');

  // ---- 写命令：完整参数抵达 IAM，只读子账号应被 IAM 拒绝 ----
  const wr = sh(['VPC', 'CreateVpc', `--cli-region=${REGION}`, '--vpc.name=hdk-ro-probe', '--vpc.cidr=10.99.0.0/16']);
  const wrDenied = !/USE_ERROR/i.test(wr.out) && DENY.test(wr.out) && !/"vpc"\s*:\s*{/i.test(wr.out);
  test('D4-13', 'write-iam-denied', wrDenied, `exit=${wr.code} ${wr.out.slice(0,160).replace(/[A-Z0-9]{20,}/g, '***')}`, 'IAM拒绝(权限不足/PolicyNotAuthorized)');
}

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-19-1.94.218.129/Linux/evidence/D4-13/stdout.log'), output, 'utf8');
console.log(output);