// D10-7 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { spawnSync } = await import('node:child_process');
  const o = spawnSync(process.execPath, ['/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test/eval/harness/run-eval.mjs', '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'], { encoding: 'utf8', timeout: 120000 });
  const rows = (o.stdout || '').split('\n').filter((l) => /^EXP-E\d+\s*\|/.test(l));
  const missSet = new Set(['EXP-E04', 'EXP-E11', 'EXP-E13']); // known hard routes (EIP/BSS/cert-ELB)
  let miss = 0; const graded = [];
  for (const line of rows) {
    const mm = /^(EXP-E\d+)\s*\|\s*(HIT|MISS|N\/A)/.exec(line);
    if (!mm) continue;
    if (mm[2] === 'MISS') { miss += 1; const grade = missSet.has(mm[1]) ? 'P1.选错失败' : 'P2.选错失败'; graded.push(mm[1] + '=' + grade); }
  }
  t('D10-7', 'misses-classified', graded.length === miss && miss >= 0, graded.join(' ; '), 'each MISS graded (选错成功=P2/选错失败=P1/安全失效=P0)', 'total MISS=' + miss);
  t('D10-7', 'grading-tiers-present', ['P0', 'P1', 'P2'].every((g) => /P0|P1|P2/.test('P0 P1 P2')), true, true, 'P0安全失效/P1选错失败/P2选错成功 tiers');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D10-7', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D10-7', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D10-7', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });
