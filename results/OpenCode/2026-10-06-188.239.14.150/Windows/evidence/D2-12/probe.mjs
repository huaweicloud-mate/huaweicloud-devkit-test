// D2-12 R10 runtime 非空禁止落盘（P1）
// 断言：存在 runtime 凭证时 auth_sync 不写 S1，返回 auto-sync suppressed；且 S1 文件内容不变
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const HOOKS = process.env.HDK_HOOKS || join(SRC, '..', 'hooks');
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-12-'));
process.env.HUAWEICLOUD_HOME = tmp;
const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);
const svc = await import(pathToFileURL(join(SRC, 'auth', 'service.mjs')).href);

const S1 = creds.globalCredentialsPath();
mkdirSync(join(tmp, '.config', 'huaweicloud'), { recursive: true });
const BEFORE = { ak: 'AKIAPREBEFOREPROBE000001', sk: 'PreBeforeProbeSecretKeyValue000000', region: 'cn-north-4', configuredBySession: true };
creds.writeGlobalCredentials(BEFORE);
const beforeRaw = readFileSync(S1, 'utf8');

// 注入 runtime 凭证
creds.setRuntimeCredentials('AKIAPROBERUNTIME00001', 'ProbeRuntimeSecretKeyValue0000000', undefined, 'cn-north-4');
const runtimeActive = creds.hasRuntimeCredentials();
const syncResult = await svc.syncAuth('all');
const afterRaw = readFileSync(S1, 'utf8');
const s1Unchanged = beforeRaw === afterRaw;
const runtimeNotOnDisk = !afterRaw.includes('AKIAPROBERUNTIME00001') && !afterRaw.includes('ProbeRuntimeSecretKeyValue0000000');
const suppressed = /suppress|R10|runtime/i.test(JSON.stringify(syncResult)) || syncResult === false || syncResult === null || (syncResult && syncResult.ok === false);
const status = svc.getAuthStatus('all');
const statusJson = JSON.stringify(status);
const statusShowsRuntime = /runtimeActive|\"runtime\":\s*true/i.test(statusJson);

creds.clearRuntimeCredentials();
const rows = [
  { id: '注入 runtime 凭证后 hasRuntimeCredentials=true', ok: runtimeActive === true, actual: runtimeActive },
  { id: 'auth_sync 在 runtime 非空时抑制落盘', ok: !!suppressed, actual: syncResult },
  { id: 'S1 文件字节级未被 runtime 凭证改写', ok: s1Unchanged, actual: { s1Unchanged } },
  { id: 'runtime 凭证未出现在 S1 磁盘文件', ok: runtimeNotOnDisk, actual: runtimeNotOnDisk },
  { id: 'auth_status 反映 runtimeActive', ok: statusShowsRuntime, actual: statusJson.slice(0, 600) },
];
const violations = rows.filter((x) => !x.ok);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `R10 成立：runtime 凭证非空时 auth_sync 抑制落盘，S1 credentials.json 字节级未被改写且不含 runtime 明文；auth_status 如实反映 runtimeActive`
      : `R10 断言不成立：${JSON.stringify(violations)}`,
  { runtimeActive, syncResult, s1Unchanged, runtimeNotOnDisk, authStatusHead: statusJson.slice(0, 800), rows, violations, probeValues: '隔离 HOME 内写入的占位凭证，仅用于本用例' });
