// D2-16 import file wiped after read（P1）
// case: creds-import.json -> auth_switch persist mode=import -> file wiped, no plaintext secrets in the reply
// hermetic: HUAWEICLOUD_HOME / HCLOUD_CONFIG_PATH / HCLOUD_OBS_CONFIG_PATH / hcloud shim
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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
const tmp = mkdtempSync(join(tmpdir(), 'd2-16-'));
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

process.env.HCLOUD_OBS_CONFIG_PATH = obsPath;
applyShimEnv();
writeFileSync(cfgPath, JSON.stringify({ current: 'deploy', profiles: [{ name: 'deploy' }] }), 'utf8');

const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const dir = join(tmp, '.config', 'huaweicloud');
mkdirSync(dir, { recursive: true });
const importPath = join(dir, 'creds-import.json');
const IMPORT_AK = 'AKIAPROBEIMPORT0000001';
const IMPORT_SK = 'ProbeImportSecretKeyValue000000000';
writeFileSync(importPath, JSON.stringify({ ak: IMPORT_AK, sk: IMPORT_SK, region: 'cn-north-4' }), 'utf8');
const existedBefore = existsSync(importPath);

const switched = await callTool('huaweicloud_auth_switch', { action: 'persist', mode: 'import' });

const afterExists = existsSync(importPath);
const leftover = afterExists ? readFileSync(importPath, 'utf8') : null;
const dirList = readdirSync(dir);
const s1 = creds.readGlobalCredentials();
const argvLines = readLines(stubLog).map((l) => JSON.parse(l));
const baseName = (p) => String(p).split(String.fromCharCode(92)).join('/').split('/').pop();
const configureArgv = argvLines.find((a) => baseName(a[0]) === 'configure' && a[1] === 'set');
const obsRaw = existsSync(obsPath) ? readFileSync(obsPath, 'utf8') : null;
const obsWritten = !!obsRaw && obsRaw.includes(IMPORT_AK);
const outJson = JSON.stringify({ switched, dirList, leftover });
const leaked = [IMPORT_AK, IMPORT_SK].filter((v) => outJson.includes(v));
const s1HasImport = !!s1 && s1.ak === IMPORT_AK && s1.sk === IMPORT_SK;

const rows = [
  { id: 'import 文件事先存在', ok: existedBefore, actual: existedBefore },
  { id: '读取后 import 文件已擦除(exists=false)', ok: afterExists === false, actual: { afterExists, leftoverHead: leftover && leftover.slice(0, 60) } },
  { id: '目录内无 creds-import.json 残留', ok: !dirList.includes('creds-import.json'), actual: dirList },
  { id: '工具返回不含明文 AK/SK', ok: leaked.length === 0, actual: leaked },
  { id: '凭证已落到 S1（persist 语义）', ok: s1HasImport, actual: { akPrefix: s1 && String(s1.ak || '').slice(0, 10), skLen: s1 && String(s1.sk || '').length, configuredBySession: s1 && s1.configuredBySession } },
  { id: 'KooCLI 端同步（shim 捕获导入 AK）', ok: !!configureArgv && configureArgv.includes('--cli-access-key=' + IMPORT_AK), actual: configureArgv },
  { id: 'OBS 端同步写入隔离配置', ok: obsWritten, actual: obsWritten },
];
const violations = rows.filter((x) => !x.ok);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `import 擦除闭环成立：creds-import.json 读取后 exists=false、目录无残留、工具返回不含明文 AK/SK；凭证按 persist 语义落到 S1 并同步 KooCLI/OBS 两端（全部隔离在临时区，真实配置零改动）`
      : `import 擦除断言不成立：${JSON.stringify(violations)}`,
  { importPath, existedBefore, afterExists, dirList, switchResult: switched, s1After: { akPrefix: s1 && String(s1.ak || '').slice(0, 10), skLen: s1 && String(s1.sk || '').length }, configureArgv, obsWritten, leaked, rows, violations, probeValues: '隔离 HOME + hcloud shim + 占位凭证，仅用于本用例' });
