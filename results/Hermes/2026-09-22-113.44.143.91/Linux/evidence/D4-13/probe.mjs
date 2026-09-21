// D4-13 (P1): 最小权限凭证通过率 — 只读 IAM 子账号 test001 实机复测
// 修正根因: hcloud(KooCLI) 不读 HW_ACCESS_KEY env（实证: 假AK仍成功），run-as-readonly.py 的 env 注入
//   被 resolveCredentials R9 分支(admin credentials.json configuredBySession=true)拦截，
//   且 hcloud 本身不读 HW_ACCESS_KEY → 之前实际走了管理员凭证，写命令仅被 safety-model deny 而非 IAM 403。
// 本次: 清空 HW_SECURITY_TOKEN + 直接 `--cli-access-key/--cli-secret-key` 注入只读凭证 → 干净验证 IAM 层拒绝。
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REGION = 'cn-north-4';
const results = [];
const out = [];
function L(s) { out.push(s); }
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected) });
  L(`${pass ? 'PASS' : 'FAIL'} | ${id}/${name} | ${String(actual).slice(0, 160)}`);
}

const roPath = join(homedir(), '.config', 'huaweicloud', 'credentials.readonly.json');
let roAk = '', roSk = '';
if (existsSync(roPath)) {
  try {
    const d = JSON.parse(readFileSync(roPath, 'utf8'));
    roAk = d.ak || ''; roSk = d.sk || '';
  } catch {}
}

// 清残留 token（本机 env 本就无残留，双保险）
delete process.env.HW_SECURITY_TOKEN;

function sh(args) {
  const full = ['--cli-access-key=' + roAk, '--cli-secret-key=' + roSk, ...args];
  const r = spawnSync('hcloud', full, { encoding: 'utf8', timeout: 90000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const DENY = /denied|forbidden|无权限|403|insufficient|not authorized|NoPermission|您没有|权限不足|not have permission|Forbidden|unauthorized|PolicyNotAuthorized|disallowed by policy/i;

L(`只读子账号: ak前缀=${roAk.slice(0, 6)}*** (len=${roAk.length}) | HW_SECURITY_TOKEN=${process.env.HW_SECURITY_TOKEN || '(空)'} | region=${REGION}`);

if (!roAk || !roSk) {
  test('D4-13', 'readonly-creds', false, '只读凭证缺失', 'credentials.readonly.json 含 ak/sk');
} else {
  // 只读命令 100% 可用
  const ro1 = sh(['ECS', 'ListServersDetails', '--cli-region=' + REGION, '--limit=1']);
  const ro1ok = ro1.code === 0 && !DENY.test(ro1.out) && !/USE_ERROR/i.test(ro1.out);
  test('D4-13', 'readonly-ListServersDetails', ro1ok, `exit=${ro1.code} ${ro1.out.slice(0, 90)}`, 'exit0+可枚举+非参数错误');

  const ro2 = sh(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--limit=1']);
  const ro2ok = ro2.code === 0 && !DENY.test(ro2.out) && !/USE_ERROR/i.test(ro2.out);
  test('D4-13', 'readonly-ListVpcs', ro2ok, `exit=${ro2.code} ${ro2.out.slice(0, 90)}`, 'exit0+可枚举+非参数错误');

  // 写命令: 完整参数抵达 IAM，只读子账号应被 IAM 拒绝(而非 safety-model deny)
  const wr = sh(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=hdk-ro-probe', '--vpc.cidr=10.99.0.0/16']);
  const wrDenied = !/USE_ERROR/i.test(wr.out) && DENY.test(wr.out);
  test('D4-13', 'write-iam-denied', wrDenied, `exit=${wr.code} ${wr.out.slice(0, 160).replace(/[A-Z0-9]{20,}/g, '***')}`, 'IAM拒绝(权限不足/PolicyNotAuthorized)');

  // 归零验证: 确认只读子账号未创建任何 hdk-ro-probe VPC
  const verify = sh(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--name=hdk-ro-probe']);
  const leaked = /hdk-ro-probe/.test(verify.out) && !DENY.test(verify.out);
  L(`[归零验证] ListVpcs name=hdk-ro-probe → ${leaked ? '发现残留(需清理)' : '无残留(归零OK)'} | ${verify.out.slice(0, 120)}`);
}

const passed = results.filter((r) => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
const outDir = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-22-113.44.143.91/Linux/evidence/D4-13';
writeFileSync(join(outDir, 'stdout.log'), out.join('\n') + '\n', 'utf8');
L('');
L('统计: ' + JSON.stringify({ total: results.length, passed, failed: results.length - passed }));
console.log(out.join('\n'));