import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeSkipState, readSkipState, judgeUpdate } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-55 多会话提示隔离：每个会话的 skip 状态按文件隔离，互不影响。
const tmp = mkdtempSync(join(tmpdir(), 'd1-55-'));
const fileA = join(tmp, 'a.json');
const fileB = join(tmp, 'b.json');
try {
  writeSkipState(fileA, '1.1.0');
  writeSkipState(fileB, '1.2.0');

  const sa = readSkipState(fileA);
  const sb = readSkipState(fileB);
  test('D1-55-1', 'session-A-own-dismissed-version', sa?.dismissedVersion === '1.1.0', sa?.dismissedVersion, '1.1.0');
  test('D1-55-2', 'session-B-own-dismissed-version', sb?.dismissedVersion === '1.2.0', sb?.dismissedVersion, '1.2.0');

  // 同一 dist-tags，A 会话在 1.1.0 冷却中，B 会话对 1.2.0 已冷却，结论各自独立
  const dist = { latest: '1.2.0', next: null };
  const ja = judgeUpdate('1.1.0', dist, sa); // target 1.2.0 > dismissed 1.1.0 => A 无冷却，update_available
  const jb = judgeUpdate('1.1.0', dist, sb); // target 1.2.0 == dismissed 1.2.0 => B 仍在冷却，dismissed
  test('D1-55-3', 'session-A-not-cooled', ja.result === 'update_available', ja.result, 'update_available');
  test('D1-55-4', 'session-B-cooled', jb.result === 'dismissed', jb.result, 'dismissed');

  // 删除一侧状态不 Affected 另一侧
  rmSync(fileA, { force: true });
  test('D1-55-5', 'delete-A-keeps-B', readSkipState(fileA) === null && readSkipState(fileB)?.dismissedVersion === '1.2.0', `A=${readSkipState(fileA)},B=${readSkipState(fileB)?.dismissedVersion}`, 'A=null,B=1.2.0');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-55', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);