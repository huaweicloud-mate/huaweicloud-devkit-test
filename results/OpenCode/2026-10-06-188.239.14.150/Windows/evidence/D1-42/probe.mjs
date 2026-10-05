// D1-42 dismiss 真实闭环与跨调用持久化（P1）
// 断言：写入 skip 文件字段完整且 expireAt=dismissedAt+3 天；同版本冷却内再次判定 dismissed；
//       另起新 Node 进程（模拟 MCP 重启）后仍生效
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
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
const tmp = mkdtempSync(join(tmpdir(), 'd1-42-'));
const skipFile = join(tmp, 'update-skip.json');
const DAY = 24 * 60 * 60 * 1000;
const T0 = 1767225600000;
const target = '1.1.2';
const epoch = (v) => (typeof v === 'number' ? v : Date.parse(v));

const first = uc.judgeUpdate('1.1.1', { latest: '1.1.2' }, null, T0);
uc.writeSkipState(skipFile, target, { at: T0, days: 3 });
const st = uc.readSkipState(skipFile);
const second = uc.judgeUpdate('1.1.1', { latest: target }, st, T0 + 60 * 1000);
const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
  const uc = await import(${JSON.stringify(pathToFileURL(join(SRC, 'update-check.mjs')).href)});
  const st = uc.readSkipState(${JSON.stringify(skipFile)});
  const j = uc.judgeUpdate('1.1.1', { latest: ${JSON.stringify(target)} }, st, ${T0 + 120 * 1000});
  process.stdout.write(JSON.stringify({ st, judge: j }));
`], { encoding: 'utf8', timeout: 60000, windowsHide: true });
let cross = null;
try { cross = JSON.parse((child.stdout || '').trim()); }
catch (e) { cross = { parseError: e.message, stdout: child.stdout, stderr: child.stderr }; }

const rows = [
  { id: '首次判定 update_available', ok: first.result === 'update_available' && first.targetVersion === target, actual: first },
  { id: 'skip 文件字段完整', ok: st.dismissedVersion === target && epoch(st.dismissedAt) > 0 && epoch(st.expireAt) > 0, actual: st },
  { id: 'expireAt = dismissedAt + 3 天', ok: epoch(st.expireAt) === epoch(st.dismissedAt) + 3 * DAY, actual: { deltaDays: (epoch(st.expireAt) - epoch(st.dismissedAt)) / DAY } },
  { id: '同版本冷却内再次判定 dismissed', ok: second.result === 'dismissed' && second.dismissed === true, actual: second },
  { id: '重启新进程后仍生效', ok: !!cross && cross.judge && cross.judge.result === 'dismissed' && cross.judge.dismissed === true, actual: cross && cross.judge },
  { id: '新进程读到同一 skip 字段', ok: !!cross && cross.st && epoch(cross.st.expireAt) === epoch(st.expireAt), actual: cross && cross.st },
];
const violations = rows.filter((x) => !x.ok);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? 'dismiss 跨调用/跨进程闭环成立：首次判定 update_available -> dismiss 写入 skip 文件（字段完整、expireAt=dismissedAt+3天）-> 同版本冷却内返回 dismissed -> 另起 Node 进程模拟 MCP 重启后仍读到同一 skip 状态并返回 dismissed'
      : `dismiss 闭环断言不成立：${JSON.stringify(violations)}`,
  { target, first, skipState: st, second, crossProcess: cross, childExit: child.status, rows, violations });
