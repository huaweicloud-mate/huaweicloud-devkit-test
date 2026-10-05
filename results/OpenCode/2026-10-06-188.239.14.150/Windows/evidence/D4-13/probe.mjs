// D4-13 minimum-privilege (readonly sub-account) enforcement (P1, real cloud)
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const HOOKS = process.env.HDK_HOOKS || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/hooks';
import { writeFileSync, readFileSync, existsSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = process.env.PROBE_LIB_DIR || 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-2830b481f319/workdir/probes';
const TESTREPO = process.env.PROBE_TESTREPO
  || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test';
const RUNNER = join(TESTREPO, 'scripts', 'run-as-readonly.py');
const HELPER = join(LIB, 'd4-13-readonly-helper.mjs');
const credFile = join(process.env.PROBE_RO_CRED || process.env.USERPROFILE || process.env.HOME,
  '.config', 'huaweicloud', 'credentials.readonly.json');
function HOME_DIR() { return mkdtempSync(join(tmpdir(), 'd4-13-out-')); }
const credExists = existsSync(credFile);
// 继承环境但清掉 hermetic 注入项，确保子进程走真实 hcloud + 真实 admin profile 路径
const childEnv = { ...process.env };
for (const k of ['HCLOUD_BIN', 'NODE_OPTIONS', 'HUAWEICLOUD_HOME', 'HCLOUD_CONFIG_PATH', 'HCLOUD_OBS_CONFIG_PATH']) delete childEnv[k];
const helperOut = join(HOME_DIR(), 'd4-13-helper-out.json');
childEnv.PROBE_HELPER_OUT = helperOut;
const r = spawnSync('python', [RUNNER, process.execPath, HELPER], {
  encoding: 'utf8', timeout: 300000, windowsHide: true, env: childEnv,
});
let helper = null;
try { helper = JSON.parse(readFileSync(helperOut, 'utf8')); } catch { helper = null; }
if (!helper) {
  try { helper = JSON.parse(String(r.stdout || '').slice(String(r.stdout || '').indexOf('{'))); } catch { helper = null; }
}
const DOMAIN = process.env.PROBE_IAM_DOMAIN || '842591186fa245929e1b5c186a4cf784';
const BAD_USER_NAME = 'p'.repeat(80);
const HCLOUD_EXE = process.env.PROBE_HCLOUD || 'C:/Users/Administrator/hcloud/hcloud.exe';
const steps = helper ? helper.steps : [];
const adminWriteArgs = helper
  ? ['--cli-region=cn-north-4', 'IAM', 'CreateUser', '--user.domain_id=' + helper.domain, '--user.name=' + helper.badUserName]
  : ['IAM', 'CreateUser', '--user.domain_id=842591186fa245929e1b5c186a4cf784', '--user.name=' + 'p'.repeat(80)];
// 管理员对照：同一写命令（非法用户名）在管理员身份下止于参数校验(1101)而非 403，
// 证明只读身份的 403 来自授权层，而不是命令本身有问题。
// 管理员对照：S1 中保存的 STS 会话凭证已过期（直调返回 APIGW.0301），因此对照命令
// 直接 spawn 真实 hcloud，由它自己解密 .hcloud/config.json 中的管理员身份。
// 非法用户名 -> 管理员侧止于参数校验(1101)，只读侧为 403，差异即授权层差异。
let adminContrast = null;
try {
  const args = ['--cli-region=cn-north-4', 'IAM', 'CreateUser', '--user.domain_id=' + DOMAIN, '--user.name=' + BAD_USER_NAME];
  const proc = spawnSync(HCLOUD_EXE, args, { encoding: 'utf-8', timeout: 120000 });
  adminContrast = { exitCode: proc.status, spawnError: proc.error ? String(proc.error) : null, exe: HCLOUD_EXE, stdout: String(proc.stdout || '').slice(0, 600), stderr: String(proc.stderr || '').slice(0, 300) };
} catch (e) { adminContrast = { error: String(e.message).slice(0, 300) }; }
const adminText = JSON.stringify(adminContrast || {}).replace(new RegExp(BAD_USER_NAME, 'g'), '<badname>');
const adminDenied = /403|not authorized|无权限|PermissionDenied|Unauthorized/i.test(adminText);
const adminValidation = /1101|不正确的参数|USE_ERROR|参数/i.test(adminText);

const rows = [
  { id: '只读子账号凭证文件存在且未注入 security token', ok: credExists && Boolean(helper) && helper.injectedTokenInEnv === false, actual: { credExists, injectedTokenInEnv: helper ? helper.injectedTokenInEnv : null } },
  { id: '只读身份读操作成功(ECS ListServersDetails)', ok: Boolean(steps[0] && steps[0].ok), actual: steps[0] || null },
  { id: '只读身份写操作被 IAM 403 拒绝(非审批门/非参数校验)', ok: Boolean(steps[1] && steps[1].permissionDenied && !steps[1].blockedByApprovalGate && !steps[1].validationError), actual: steps[1] || null },
  { id: '管理员同命令未被 403/Unauthorized(止于参数校验) => 403 来自授权层', ok: adminContrast !== null && adminDenied === false && adminValidation === true, actual: { adminDenied, adminValidation, sample: adminText.slice(0, 240) } },
  { id: '写操作未创建任何 IAM 用户', ok: Boolean(helper) && helper.postCheckOk === true, actual: { postCheckOk: helper ? helper.postCheckOk : null, note: '对照命令使用 80 字符非法用户名，管理员侧返回 1101 参数校验失败，两侧均不可能创建用户' } },
  { id: '只读子账号输出未裸回显 AK/SK', ok: Boolean(helper) && helper.leak === false, actual: helper ? { leak: helper.leak, leakLocation: (steps.find((x) => x.leakedAk || x.leakedSk) || {}).leakLocation || null } : null },
];
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? '最小权限通过率成立：只读 IAM 子账号（无 STS token）读操作 100% 成功，写操作被 IAM 拒绝且未产生资源，输出未裸回显 AK/SK'
      : `最小权限断言不成立：${JSON.stringify(violations.map((v) => v.id))}（runner exit=${r.status}）`,
  { runner: RUNNER, helper: HELPER, credFile, credExists, helperExit: r.status, helper, adminContrast, rows, violations });
