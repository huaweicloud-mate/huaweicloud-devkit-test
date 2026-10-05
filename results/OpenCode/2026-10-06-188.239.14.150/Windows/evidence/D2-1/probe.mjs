// D2-1 auth init 三端同步（P1）
// case: isolated HOME + fake creds run auth init -> KooCLI/OBS/S1 three ends landed (path+format) -> real cloud E2E API reachable
// hermetic: all three ends redirected (KooCLI via shim); real cloud E2E in a clean child process
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}
const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);
function readLines(p) { return readFileSync(p, 'utf8').split(NL).map((s) => s.split(CR).join('').trim()).filter(Boolean); }

// hcloud shim: intercepts any spawn whose first arg looks like a KooCLI subcommand
const SHIM = `const fs = require('node:fs');
const argv = process.argv.slice(1);
const first = String(argv[0] || '');
const isScript = () => /[.](mjs|cjs|js|json|ts)$/i.test(first);
if (first && !isScript()) {
  if (process.env.STUB_LOG) fs.appendFileSync(process.env.STUB_LOG, JSON.stringify(argv) + String.fromCharCode(10));
  if (['version', '--version', '-v', '-V'].includes(first)) {
    let ver = '0.0.0';
    try { ver = JSON.parse(fs.readFileSync(process.env.STUB_PKG, 'utf8')).kooCliVersion || ver; } catch {}
    process.stdout.write('KooCLI Current version: ' + ver + String.fromCharCode(10));
  } else if (first === 'IAM' && argv.includes('KeystoneListProjects')) {
    fs.writeFileSync(process.env.STUB_PROJ, JSON.stringify({ projects: [{ id: process.env.STUB_PROJECT_ID, name: process.env.STUB_REGION || 'cn-north-4' }] }));
  }
  process.exit(0);
}`;
const tmp = mkdtempSync(join(tmpdir(), 'd2-1-'));
const home = join(tmp, 'home');
mkdirSync(home, { recursive: true });
const cfgPath = join(tmp, 'hcloud-config.json');
const obsPath = join(tmp, 'obsutilconfig');
const stubLog = join(tmp, 'hcloud-argv.log');
const shimJs = join(tmp, 'shim.cjs');
const stubProj = join(tmp, 'proj.json');
const pkgJson = join(SRC, '..', '..', 'package.json');
writeFileSync(shimJs, SHIM);
writeFileSync(stubLog, '');
writeFileSync(stubProj, '');
process.env.STUB_LOG = stubLog;
process.env.STUB_PROJ = stubProj;
process.env.STUB_PKG = pkgJson;
process.env.STUB_PROJECT_ID = '46c1fd48bd1248c7b75afc3780de7132';
process.env.STUB_REGION = 'cn-north-4';
process.env.HCLOUD_BIN = process.execPath;
process.env.HCLOUD_CONFIG_PATH = cfgPath;
process.env.HUAWEICLOUD_HOME = tmp;
function applyShimEnv(extra = {}) {
  delete process.env.NODE_OPTIONS;
  process.env.NODE_OPTIONS = '--require ' + shimJs;
  Object.assign(process.env, extra);
}

const AK = 'AKIAPROBEINIT00000001';
const SK = 'ProbeInitSecretKeyValue0000000000000';
const realHome = process.env.USERPROFILE;
const realHomePosix = process.env.HOME;
applyShimEnv({ HOME: home, USERPROFILE: home, HCLOUD_OBS_CONFIG_PATH: obsPath, HW_ACCESS_KEY: AK, HW_SECRET_KEY: SK, HW_REGION: 'cn-north-4' });

const obsReal = join(homedir(), '.obsutilconfig');
const kooReal = join(homedir(), '.hcloud', 'config.json');
const hashOf = (p) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null);
const obsHashBefore = hashOf(obsReal);
const kooHashBefore = hashOf(kooReal);

const initRun = spawnSync(process.execPath, [join(SRC, 'setup-cli.mjs'), 'auth', 'init'], {
  encoding: 'utf8', timeout: 180000, windowsHide: true, env: { ...process.env },
});

const s1Path = join(tmp, '.config', 'huaweicloud', 'credentials.json');
const s1 = existsSync(s1Path) ? JSON.parse(readFileSync(s1Path, 'utf8')) : null;
const obsRaw = existsSync(obsPath) ? readFileSync(obsPath, 'utf8') : null;
const obsLines = obsRaw ? obsRaw.split(NL).map((s) => s.split(CR).join('').trim()).filter(Boolean) : [];
const argvLines = readLines(stubLog).map((l) => JSON.parse(l));
const baseName = (p) => String(p).split(String.fromCharCode(92)).join('/').split('/').pop();
const configureArgv = argvLines.find((a) => baseName(a[0]) === 'configure' && a[1] === 'set');
const versionArgv = argvLines.find((a) => baseName(a[0]) === 'version');

const s1Ok = !!s1 && s1.ak === AK && s1.sk === SK && s1.region === 'cn-north-4';
const endpointLine = obsLines.find((l) => l.startsWith('endpoint='));
const obsOk = !!obsRaw && obsRaw.includes(AK) && !!endpointLine && endpointLine.includes('https://obs.') && endpointLine.includes('.myhuaweicloud.com');
const obsFormatOk = obsLines.some((l) => l.startsWith('endpoint=')) && obsLines.some((l) => l.startsWith('ak=')) && obsLines.some((l) => l.startsWith('sk='));
const kooOk = !!configureArgv && configureArgv.some((a) => a.startsWith('--cli-profile=')) && configureArgv.includes('--cli-access-key=' + AK) && configureArgv.includes('--cli-region=cn-north-4');

const cleanEnv = { ...process.env };
for (const k of ['HUAWEICLOUD_HOME', 'HCLOUD_CONFIG_PATH', 'HCLOUD_OBS_CONFIG_PATH', 'HCLOUD_BIN', 'NODE_OPTIONS', 'STUB_LOG', 'STUB_PROJ', 'STUB_PKG', 'STUB_PROJECT_ID', 'STUB_REGION', 'HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_REGION', 'HOME', 'USERPROFILE']) delete cleanEnv[k];
const realRun = spawnSync('hcloud', ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'], { encoding: 'utf8', timeout: 120000, windowsHide: true, env: cleanEnv });
const realText = String(realRun.stdout || '') + String(realRun.stderr || '');
const realApiOk = realText.includes('"count":') && !realText.includes('APIGW.0301') && !realText.includes('Unauthorized') && !realText.includes('error_code');

for (const k of ['HUAWEICLOUD_HOME', 'HCLOUD_CONFIG_PATH', 'HCLOUD_OBS_CONFIG_PATH', 'HCLOUD_BIN', 'NODE_OPTIONS']) delete process.env[k];
if (realHome !== undefined) process.env.USERPROFILE = realHome;
if (realHomePosix !== undefined) process.env.HOME = realHomePosix;
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
let statusReal = null;
try { statusReal = await callTool('huaweicloud_auth_status', { target: 'all' }); } catch (e) { statusReal = { error: e.message }; }
const statusCredOk = !!statusReal && statusReal.credentialsConfigured === true;
const statusKooOk = !!statusReal && statusReal.kooCliInstalled === true;
const statusObsOk = !!statusReal && statusReal.obsConfigured === true;

const obsHashAfter = hashOf(obsReal);
const kooHashAfter = hashOf(kooReal);
const realUntouched = obsHashBefore === obsHashAfter && kooHashBefore === kooHashAfter;
const obsHead = obsLines.map((l) => (l.startsWith('sk=') ? 'sk=***' : l));

rmSync(tmp, { recursive: true, force: true });
const rows = [
  { id: '隔离 HOME 下 auth init CLI 执行完成', ok: initRun.status === 0, actual: { exit: initRun.status } },
  { id: 'S1（沙箱会话源）落位且格式正确', ok: s1Ok, actual: { s1Path, akPrefix: s1 && String(s1.ak).slice(0, 10), region: s1 && s1.region } },
  { id: 'OBS 配置落位且格式正确(endpoint/ak/sk 键齐备)', ok: obsOk && obsFormatOk, actual: { obsPath, obsOk, obsFormatOk, lines: obsHead } },
  { id: 'KooCLI 端实参落位(--cli-profile/--cli-access-key/--cli-region)', ok: kooOk, actual: configureArgv },
  { id: '真云 E2E：KooCLI 只读 API 实际连通', ok: realApiOk, actual: realText.slice(0, 240) },
  { id: '真云 E2E：auth_status 报告 S1 凭证已配置', ok: statusCredOk, actual: { credentialsConfigured: statusReal && statusReal.credentialsConfigured } },
  { id: '真云 E2E：auth_status 报告 KooCLI 已安装', ok: statusKooOk, actual: { kooCliInstalled: statusReal && statusReal.kooCliInstalled } },
  { id: '真云 E2E：auth_status 报告 OBS 配置就绪', ok: statusObsOk, actual: { obsConfigured: statusReal && statusReal.obsConfigured, obsConfigPath: statusReal && statusReal.obsConfigPath } },
  { id: '真实 KooCLI/OBS 配置文件未被本用例改动', ok: realUntouched, actual: { obsUntouched: obsHashBefore === obsHashAfter, kooUntouched: kooHashBefore === kooHashAfter } },
];
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `auth init 三端同步成立：隔离环境下 S1/KooCLI/OBS 三端配置均落位且格式正确（OBS 键齐备、KooCLI 收到 --cli-profile/--cli-access-key/--cli-region 实参）；真实凭证下 KooCLI 只读 API 实际连通、auth_status 报告 S1/KooCLI/OBS 三端就绪，且真实配置文件全程零改动`
      : `auth init 三端同步断言不成立：${JSON.stringify(violations)}`,
  { initExit: initRun.status, versionArgv, ends: { s1: { path: s1Path, ok: s1Ok }, obs: { path: obsPath, ok: obsOk && obsFormatOk, lines: obsHead }, kooCli: { ok: kooOk, argv: configureArgv } }, realCloudE2E: { listServersHead: realText.slice(0, 300), exit: realRun.status, authStatus: { credentialsConfigured: statusReal && statusReal.credentialsConfigured, kooCliInstalled: statusReal && statusReal.kooCliInstalled, obsConfigured: statusReal && statusReal.obsConfigured } }, realUntouched, rows, violations, probeValues: '源码级用隔离 HOME + 占位凭证 + hcloud shim；真云 E2E 用真实凭证只读调用' });
