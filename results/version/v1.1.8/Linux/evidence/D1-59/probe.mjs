import { writeFileSync } from 'node:fs';
import { judgeUpdate, getCachedUpdateInfo, invalidateUpdateCache } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

const saved = process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
// 清除历史值，先验证“恢复真实检测”基线
delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
const baseline = judgeUpdate('1.1.0', { latest: '1.2.0', next: null });
test('D1-59-1', 'baseline-detects-update', baseline.result === 'update_available', baseline.result, 'update_available');

try {
  process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE = '1';
  const r = judgeUpdate('1.1.0', { latest: '1.2.0', next: null });
  test('D1-59-2', 'skip-env-forces-up_to_date', r.result === 'up_to_date' && r.updateAvailable === false, `${r.result}/av=${r.updateAvailable}`, 'up_to_date/av=false');

  let q = 0;
  const doQuery = async () => {
    q += 1;
    return { latest: '1.2.0', next: null };
  };
  invalidateUpdateCache();
  const g = await getCachedUpdateInfo('1.1.0', { doQuery, now: Date.now() });
  test('D1-59-3', 'skip-env-no-registry-query', g.result === 'up_to_date' && q === 0, `q=${q},result=${g.result}`, 'q=0,up_to_date');
} finally {
  if (saved === undefined) delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
  else process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE = saved;
}

// unset 后恢复真实检测
const r2 = judgeUpdate('1.1.0', { latest: '1.2.0', next: null });
test('D1-59-4', 'unset-restores-detection', r2.result === 'update_available', r2.result, 'update_available');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-59', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);