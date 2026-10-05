// D2-26 凭证备份与恢复（P1）
// 断言：backupGlobalCredentials 生成备份文件；改写凭证后 restoreGlobalCredentialsBackup 完整还原
import { writeFileSync, mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
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

const tmp = mkdtempSync(join(tmpdir(), 'd2-26-'));
process.env.HUAWEICLOUD_HOME = tmp;
const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);

const ORIG = { ak: 'AKIAPROBEORIGINAL001', sk: 'ProbeOriginalSecretKeyValue0000000', region: 'cn-north-4', projectId: 'probe-project-0001' };
creds.writeGlobalCredentials(ORIG);
const before = JSON.stringify(creds.readGlobalCredentials());

const backupPath = creds.backupGlobalCredentials();
const backupExists = !!backupPath && existsSync(backupPath);
const backupContent = backupExists ? readFileSync(backupPath, 'utf8') : null;

const MUTATED = { ak: 'AKIAPROBEMUTATED0001', sk: 'ProbeMutatedSecretKeyValue00000000', region: 'cn-south-1', projectId: 'probe-project-0002' };
creds.writeGlobalCredentials(MUTATED);
const mutated = JSON.stringify(creds.readGlobalCredentials());
const mutatedDiffers = mutated !== before;

const restored = creds.restoreGlobalCredentialsBackup(backupPath);
const afterRestore = JSON.stringify(creds.readGlobalCredentials());
const restoreExact = afterRestore === before;

const rows = [
  { id: 'backupGlobalCredentials 生成备份文件', ok: backupExists, actual: backupPath },
  { id: '备份内容含原始 AK/SK', ok: !!backupContent && backupContent.includes(ORIG.ak) && backupContent.includes(ORIG.sk), actual: { chars: backupContent && backupContent.length } },
  { id: '改写凭证后与原始不同', ok: mutatedDiffers, actual: mutatedDiffers },
  { id: 'restoreGlobalCredentialsBackup 完整还原', ok: restoreExact, actual: { restoreExact, restored } },
];
const violations = rows.filter((x) => !x.ok);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `凭证备份/恢复闭环成立：备份文件生成且含原始 AK/SK；改写后 restoreGlobalCredentialsBackup 使 S1 字节级还原`
      : `凭证备份/恢复断言不成立：${JSON.stringify(violations)}`,
  { backupPath, backupExists, mutatedDiffers, restoreExact, rows, violations, probeValues: '隔离 HOME + 占位凭证，未触碰真实 S1' });
