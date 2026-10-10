// D4-13 最小权限凭证通过率 — 只读子账号 (run-as-readonly.py 注入 env)
// 执行: python scripts/run-as-readonly.py node evidence/D4-13/probe.mjs
// 关键: 写操作须经 hcloud --cli-access-key/--cli-secret-key 显式传只读凭证 (hcloud 默认读 ~/.hcloud/config 管理员)
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const REGION = process.env.HW_REGION || 'cn-north-4';
const RAK = process.env.HW_ACCESS_KEY;
const RSK = process.env.HW_SECRET_KEY;

const cred = await import(`file://${HDK}/src/auth/credentials.mjs`);
const { validateIamCredentials } = await import(`file://${HDK}/src/auth/credential-validator.mjs`);

function fp(ak) { return createHash('sha1').update(ak || '').digest('hex').slice(0, 8); }
function sh(args) { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 60000 }); return (r.stdout || '') + (r.stderr || ''); }

const out = [];
out.push('=== D4-13 最小权限凭证通过率 (只读子账号 test001) ===');
out.push(`注入 env HW_ACCESS_KEY 指纹 = ${fp(RAK)}`);
out.push(`HW_SECURITY_TOKEN 已注入 = ${!!process.env.HW_SECURITY_TOKEN} (期望 false)`);

const resolved = cred.resolveCredentialsWithRuntime({});
const resolvedAk = resolved.ak || '';
out.push(`[1] resolveCredentialsWithRuntime 命中 AK 指纹 = ${fp(resolvedAk)} (env 覆盖文件, 动态切换)`);

// 只读 IAM 校验 (KeystoneListProjects 只读)
let valid = false, projectId = '';
try {
  const v = await validateIamCredentials({ ak: resolvedAk, sk: resolved.sk, securityToken: resolved.securityToken, region: REGION, timeoutMs: 20000 });
  valid = v.valid === true; projectId = v.projectId || '';
  out.push(`[2] validateIamCredentials(KeystoneListProjects 只读) -> valid=${valid} projectId=${projectId ? projectId.slice(0,8)+'...' : '(空)'}`);
} catch (e) { out.push(`[2] validateIamCredentials -> THROW: ${e.message}`); }

// 只读凭证跑只读用例 (--cli-access-key 显式传只读凭证)
const read = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`, `--cli-access-key=${RAK}`, `--cli-secret-key=${RSK}`]);
const readOk = /count|servers|"servers"|\[\]/.test(read) && !/error|Error|401|403|Forbidden/i.test(read);
out.push(`[3] 只读凭证 ListServersDetails(只读) -> ${readOk ? '成功(可用)' : '失败'} :: ${read.slice(0, 120)}`);

// 只读凭证写操作 (CreateVpc) -> 期望 IAM 拒绝 (权限不足)
const write = sh(['VPC', 'CreateVpc', `--vpc.name=hdk1-r13-${Date.now().toString().slice(-6)}`, '--vpc.cidr=192.168.212.0/24', `--cli-region=${REGION}`, `--cli-access-key=${RAK}`, `--cli-secret-key=${RSK}`]);
const writeDenied = /Forbidden|denied|403|APIGW|0802|not authorized|permission|unauthorized|权限|Unauthorized|You are not authorized/i.test(write);
// 若意外放行, 立即删除归零
let leakedCleanup = '';
if (!writeDenied) {
  const id = /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(write)?.[1];
  if (id) { leakedCleanup = sh(['VPC', 'DeleteVpc', `--vpc_id=${id}`, `--cli-region=${REGION}`]); leakedCleanup = `(已清理意外创建 VPC ${id})`; }
}
out.push(`[4] 只读凭证 CreateVpc(写) -> ${writeDenied ? '被拒(权限不足)' : '意外放行'} ${leakedCleanup} :: ${write.slice(0, 150)}`);

const ok = valid && !process.env.HW_SECURITY_TOKEN && readOk && writeDenied;
out.push('');
out.push(`只读 IAM 校验=${valid}; 只读可用=${readOk}; 写被拒=${writeDenied}`);
out.push(`RESULT: ${ok ? 'PASS' : 'FAIL'}`);

const d = join(EVID, 'D4-13');
mkdirSync(d, { recursive: true });
writeFileSync(join(d, 'stdout.txt'), out.join('\n'), 'utf8');
console.log(out.join('\n'));