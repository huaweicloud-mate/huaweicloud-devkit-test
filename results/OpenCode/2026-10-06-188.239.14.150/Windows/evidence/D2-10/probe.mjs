// D2-10 R7 current follow（P1）
// case: build current=deploy -> readKooCliProfiles -> switch current and re-parse -> verify runHcloudConfigure passes --cli-profile=
// hermetic: HCLOUD_CONFIG_PATH + hcloud shim
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
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
const tmp = mkdtempSync(join(tmpdir(), 'CASE-'));
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

const realCfg = join(homedir(), '.hcloud', 'config.json');
const realBefore = existsSync(realCfg) ? createHash('sha256').update(readFileSync(realCfg)).digest('hex') : null;
applyShimEnv();

const rec = await import(pathToFileURL(join(SRC, 'auth', 'reconcile.mjs')).href);
const kooCliConfigPath = rec.kooCliConfigPath();

writeFileSync(cfgPath, JSON.stringify({ current: 'deploy', profiles: [{ name: 'deploy' }, { name: 'other' }] }), 'utf8');
const parsed1 = rec.readKooCliProfiles();
const managed1 = rec.resolveManagedProfile();
const followsDeploy = !!parsed1 && parsed1.current === 'deploy' && managed1 === 'deploy';

writeFileSync(cfgPath, JSON.stringify({ current: 'other', profiles: [{ name: 'deploy' }, { name: 'other' }] }), 'utf8');
const parsed2 = rec.readKooCliProfiles();
const managed2 = rec.resolveManagedProfile();
const followsOther = !!parsed2 && parsed2.current === 'other' && managed2 === 'other';

writeFileSync(cfgPath, JSON.stringify({ current: 'deploy', profiles: [{ name: 'deploy' }, { name: 'other' }] }), 'utf8');
const recSrc = readFileSync(join(SRC, 'auth', 'reconcile.mjs'), 'utf8');
const sourcePassesCliProfile = recSrc.includes('--cli-profile=' + '$' + '{profile}');
let configureRun = null;
try { configureRun = rec.runHcloudConfigure(managed1, 'AKIAPROBEDEPLOY00001', 'ProbeDeploySecretKeyValue000000000', 'cn-north-4'); }
catch (e) { configureRun = { ok: false, error: e.message }; }
const argvLines = readLines(stubLog).map((l) => JSON.parse(l));
const baseName = (p) => String(p).split(String.fromCharCode(92)).join('/').split('/').pop();
const configureArgv = argvLines.find((a) => baseName(a[0]) === 'configure' && a[1] === 'set');
const hasCliProfileArg = !!configureArgv && configureArgv.includes('--cli-profile=' + managed1);
const hasRegionArg = !!configureArgv && configureArgv.includes('--cli-region=cn-north-4');
const hasKeyArg = !!configureArgv && configureArgv.includes('--cli-access-key=AKIAPROBEDEPLOY00001');
const realAfter = existsSync(realCfg) ? createHash('sha256').update(readFileSync(realCfg)).digest('hex') : null;
const realUntouched = realBefore === realAfter;

const rows = [
  { id: 'kooCliConfigPath 指向隔离配置', ok: kooCliConfigPath === cfgPath, actual: kooCliConfigPath },
  { id: 'readKooCliProfiles 解析 current=deploy', ok: !!parsed1 && parsed1.current === 'deploy', actual: parsed1 && parsed1.current },
  { id: 'resolveManagedProfile 跟随 current=deploy', ok: followsDeploy, actual: managed1 },
  { id: '切换 current=other 后解析与跟随同步变化', ok: followsOther, actual: { parsed: parsed2 && parsed2.current, managed: managed2 } },
  { id: 'runHcloudConfigure 源码实参含 --cli-profile=', ok: sourcePassesCliProfile, actual: sourcePassesCliProfile },
  { id: 'runHcloudConfigure 实际 argv 含 --cli-profile=current', ok: hasCliProfileArg, actual: configureArgv },
  { id: 'argv 同时携带 region/ak 参数', ok: hasRegionArg && hasKeyArg, actual: { hasRegionArg, hasKeyArg } },
  { id: '真实 KooCLI 配置文件未被本用例改动', ok: realUntouched, actual: { realUntouched } },
];
const violations = rows.filter((x) => !x.ok);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `R7 current 跟随成立：隔离配置下 readKooCliProfiles 解析 current=deploy 且 resolveManagedProfile 返回 deploy；切换 current=other 后解析与跟随同步变化；runHcloudConfigure 实参含 --cli-profile=deploy（连同 region/ak），全程真实 KooCLI 配置零改动`
      : `R7 current 跟随断言不成立：${JSON.stringify(violations)}`,
  { kooCliConfigPath, parsed1Current: parsed1 && parsed1.current, managed1, parsed2Current: parsed2 && parsed2.current, managed2, configureRun, configureArgv, rows, violations });
