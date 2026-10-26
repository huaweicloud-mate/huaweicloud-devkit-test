// probe_d413.mjs — D4-13 最小权限凭证通过率 (只读子账号, run-as-readonly.py 注入 env)
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const REGION = process.env.HW_REGION || 'cn-north-4';
const RAK = process.env.HW_ACCESS_KEY;
const RSK = process.env.HW_SECRET_KEY;
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const fp = (ak) => createHash('sha1').update(ak || '').digest('hex').slice(0, 8);
const sh = (args, t = 60000) => { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: t }); return (r.stdout || '') + (r.stderr || ''); };

function rec(status, actual, detail = '') {
  const d = join(EVID, 'D4-13'); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: 'D4-13', title: '最小权限凭证通过率', expected: '只读子账号只读可用、写被 IAM 拒绝（最小权限）', actual, detail, executedAt: now14(), probe: 'probe_d413.mjs' }, null, 2), 'utf8');
  console.log(`${status}\tD4-13\t${actual}`);
}

const out = [];
out.push(`注入 env AK 指纹=${fp(RAK)} securityToken注入=${!!process.env.HW_SECURITY_TOKEN}(期望 false)`);
const cred = await import(`file://${HDK}/src/auth/credentials.mjs`);
const { validateIamCredentials } = await import(`file://${HDK}/src/auth/credential-validator.mjs`);
const resolved = cred.resolveCredentialsWithRuntime({});
out.push(`resolveCredentialsWithRuntime AK指纹=${fp(resolved.ak)}`);
let valid = false, projectId = '';
try { const v = await validateIamCredentials({ ak: resolved.ak, sk: resolved.sk, securityToken: resolved.securityToken, region: REGION, timeoutMs: 20000 }); valid = v.valid === true; projectId = v.projectId || ''; out.push(`validateIamCredentials valid=${valid} projectId=${projectId ? projectId.slice(0, 8) + '...' : '(空)'}`); }
catch (e) { out.push('validateIamCredentials THROW: ' + e.message); }

const read = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`, `--cli-access-key=${RAK}`, `--cli-secret-key=${RSK}`]);
const readOk = /"count"\s*:/.test(read) && /"servers"\s*:/.test(read) && !/"(error_code|error_msg|error)"\s*:|Forbidden|Unauthorized|not authorized/i.test(read);
out.push(`只读 ListServersDetails -> ${readOk ? '可用' : '失败'}: ${read.slice(0, 100)}`);

const write = sh(['VPC', 'CreateVpc', `--vpc.name=hdk1-r13-${Date.now().toString().slice(-6)}`, '--vpc.cidr=192.168.213.0/24', `--cli-region=${REGION}`, `--cli-access-key=${RAK}`, `--cli-secret-key=${RSK}`]);
let writeDenied = /Forbidden|denied|403|not authorized|permission|Unauthorized|权限/i.test(write);
let cleaned = '';
if (!writeDenied) { const id = /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(write)?.[1]; if (id) { sh(['VPC', 'DeleteVpc', `--vpc_id=${id}`, `--cli-region=${REGION}`]); cleaned = `(已清理意外创建 VPC ${id})`; } }
out.push(`只读凭证 CreateVpc(写) -> ${writeDenied ? '被拒(权限不足)' : '意外放行'} ${cleaned}: ${write.slice(0, 120)}`);

const ok = valid && !process.env.HW_SECURITY_TOKEN && readOk && writeDenied;
rec(ok ? 'PASS' : 'FAIL', out.join(' | ') + ` => 只读IAM校验=${valid} 只读可用=${readOk} 写被拒=${writeDenied}`);
