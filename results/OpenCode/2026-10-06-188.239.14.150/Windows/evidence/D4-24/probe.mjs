// D4-24 approval/confirm token: repeat confirmation and expiry (P1, hermetic)
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
const HOME = mkdtempSync(join(tmpdir(), 'd4-24-home-'));
const OBS_CFG = join(HOME, 'obsutilconfig');
const APPROVALS = join(HOME, '.config', 'huaweicloud', 'approvals.json');
const SHIM_LOG = join(HOME, 'shim-argv.jsonl');
const AK_A = 'AKIAPROBED424AAAAAAAAA';
const AK_B = 'AKIAPROBED424BBBBBBBBB';
const SK = 'ProbeD24SecretKey0000000000000000';
const env = {
  ...process.env,
  HUAWEICLOUD_HOME: HOME,
  HCLOUD_OBS_CONFIG_PATH: OBS_CFG,
  HCLOUD_CONFIG_PATH: join(HOME, 'hcloud-config.json'),
  HCLOUD_BIN: process.execPath,
  NODE_OPTIONS: '--require ' + join(LIB, 'd4-24-shim.cjs'),
  PROBE_SHIM_LOG: SHIM_LOG,
  PROBE_CASE: 'D4-24',
  HDK_SRC: SRC,
  HDK_HOOKS: HOOKS,
};
// 预置 KooCLI 基线配置：persist 走 resolveManagedProfile() -> readKooCliProfiles()，
// 只读取已有 current，不会在缺失时创建 profile。
writeFileSync(join(HOME, 'hcloud-config.json'), JSON.stringify({
  current: 'devkit-managed',
  authEncrypt: 'false',
  profiles: [{ name: 'devkit-managed', accessKeyId: '', secretAccessKey: '', region: 'cn-north-4', language: 'en-us' }],
}, null, 2), 'utf8');
const DRIVER_OUT = join(HOME, 'driver-out.json');
env.PROBE_DRIVER_OUT = DRIVER_OUT;
const node = spawnSync(process.execPath, [join(LIB, 'd4-24-driver.mjs')], { encoding: 'utf8', env, timeout: 180000, windowsHide: true });
let driver = null;
try { driver = JSON.parse(readFileSync(DRIVER_OUT, 'utf8')); } catch { driver = null; }
if (!driver) {
  finish('FAIL', `D4-24 驱动脚本未产出可解析结果：exit=${node.status} stderr=${String(node.stderr || '').slice(0, 300)}`, { nodeExit: node.status, stdout: String(node.stdout || '').slice(0, 600), stderr: String(node.stderr || '').slice(0, 1200) });
} else {
  const rows = driver.rows;
  const violations = rows.filter((r) => !r.ok);
  const ok = violations.length === 0;
  finish(ok ? 'PASS' : 'FAIL',
    ok ? `token 生命周期成立：${rows.length} 项断言全部通过——confirm token 二次确认返回 already_processed、未知 token 返回 CONFIRM_TOKEN_NOT_FOUND；approvalToken 过期返回 CONFIRM_TOKEN_EXPIRED 且零执行、二次使用返回 already_processed`
        : `token 生命周期断言不成立：${JSON.stringify(violations.map((v) => v.id))}`,
    { driver, rows, violations, hermeticHome: HOME, note: 'hermetic: 凭证/approvals/OBS/KooCLI 全部落在临时目录，hcloud 由 shim 拦截', observation: 'persist 通过 resolveManagedProfile() 读取 KooCLI current profile，只读不创建：全新环境（无 .hcloud/config.json）首次 persist 返回 partial + hcloud.reason=KooCLI current profile unresolved，S2 不会同步' });
}
