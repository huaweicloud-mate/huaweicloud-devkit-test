// D1-27 检测语义-已是最新（P1）
// 断言：judgeUpdate(current=1.1.2, distTags={latest:1.1.2}) -> result=up_to_date, updateAvailable=false
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
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
const res = uc.judgeUpdate('1.1.2', { latest: '1.1.2' }, null);
const rows = [
  { current: '1.1.2', distTags: { latest: '1.1.2' }, result: res },
  { current: '1.1.7', distTags: { latest: '1.1.7', next: '1.1.8-next.1' }, result: uc.judgeUpdate('1.1.7', { latest: '1.1.7', next: '1.1.8-next.1' }, null) },
  { current: '2.0.0', distTags: { latest: '1.1.7' }, result: uc.judgeUpdate('2.0.0', { latest: '1.1.7' }, null) },
];
const violations = rows.filter((x) => x.result.result !== 'up_to_date' || x.result.updateAvailable !== false);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `${rows.length} 组"已是最新"输入（含 distTags 带 next 标签、当前版本高于 latest）judgeUpdate 均返回 result=up_to_date、updateAvailable=false`
      : `已是最新语义不成立：${JSON.stringify(violations)}`,
  { rows, violations });
