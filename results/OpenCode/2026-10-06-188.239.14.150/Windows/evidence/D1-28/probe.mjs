// D1-28 检测语义-有新版本（P1）
// 断言：judgeUpdate(current=1.1.1, distTags={latest:1.1.2}) -> result=update_available,
//       updateAvailable=true, targetVersion=1.1.2
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
const cases = [
  { current: '1.1.1', distTags: { latest: '1.1.2' }, expectTarget: '1.1.2' },
  { current: '1.1.7', distTags: { latest: '1.1.7', next: '1.1.8-next.1' }, expectTarget: '1.1.8-next.1' },
  { current: '0.9.0', distTags: { latest: '1.1.2' }, expectTarget: '1.1.2' },
];
const rows = cases.map((c) => {
  const r = uc.judgeUpdate(c.current, c.distTags, null);
  return {
    ...c, result: r,
    satisfied: r.result === 'update_available' && r.updateAvailable === true && r.targetVersion === c.expectTarget,
  };
});
const violations = rows.filter((x) => !x.satisfied);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `${rows.length} 组"有新版本"输入 judgeUpdate 均返回 result=update_available、updateAvailable=true 且 targetVersion 精确匹配期望（含 next 标签路由）`
      : `有新版本语义不成立：${JSON.stringify(violations)}`,
  { rows, violations });
