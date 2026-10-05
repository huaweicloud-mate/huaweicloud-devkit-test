// D1-31 dismiss 冷却期（P1）
// 断言：writeSkipState 写入后，冷却期内 judgeUpdate 返回 result=dismissed、dismissed=true；
//       expireAt = dismissedAt + 3 天；3 天后再查恢复提醒
import { writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const SERVER = join(SRC, 'mcp-server.mjs');
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const uc = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);
const tmp = mkdtempSync(join(tmpdir(), 'd1-31-'));
const skipFile = join(tmp, 'update-skip.json');
const DAY = 24 * 60 * 60 * 1000;
const T0 = 1767225600000;
uc.writeSkipState(skipFile, '1.1.2', { at: T0, days: 3 });
const written = existsSync(skipFile);
const raw = JSON.parse((await import('node:fs')).readFileSync(skipFile, 'utf8'));
const st = uc.readSkipState(skipFile);
const epoch = (v) => (typeof v === 'number' ? v : Date.parse(v));
const cooldownJudge = uc.judgeUpdate('1.1.1', { latest: '1.1.2' }, st, T0 + 1000);
const afterJudge = uc.judgeUpdate('1.1.1', { latest: '1.1.2' }, st, T0 + 3 * DAY + 1000);
const rows = [
  { id: 'skip 文件已写入', ok: written, actual: written },
  { id: 'dismissedAt 记录正确', ok: epoch(st.dismissedAt) === T0, actual: st.dismissedAt },
  { id: 'expireAt = dismissedAt + 3 天', ok: epoch(st.expireAt) === epoch(st.dismissedAt) + 3 * DAY, actual: { dismissedAt: st.dismissedAt, expireAt: st.expireAt, deltaDays: (epoch(st.expireAt) - epoch(st.dismissedAt)) / DAY } },
  { id: 'dismissedVersion 记录正确', ok: st.dismissedVersion === '1.1.2', actual: st.dismissedVersion },
  { id: '冷却期内 result=dismissed 且 dismissed=true', ok: cooldownJudge.result === 'dismissed' && cooldownJudge.dismissed === true, actual: cooldownJudge },
  { id: '冷却期后恢复提醒(update_available)', ok: afterJudge.result === 'update_available' && afterJudge.updateAvailable === true, actual: afterJudge },
];
const violations = rows.filter((x) => !x.ok);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `dismiss 冷却期闭环成立：skip 文件写入字段完整（dismissedVersion=${st.dismissedVersion}，dismissedAt/expireAt 以 ISO 落盘），expireAt 精确等于 dismissedAt+3 天（实测 ${(epoch(st.expireAt) - epoch(st.dismissedAt)) / DAY} 天）；冷却期内 judgeUpdate 返回 result=dismissed、dismissed=true；3 天后自动恢复 update_available`
      : `dismiss 冷却期断言不成立：${JSON.stringify(violations)}`,
  { skipFileRaw: raw, skipState: st, cooldownJudge, afterCooldownJudge: afterJudge, rows, violations, cooldownDays: 3 });
