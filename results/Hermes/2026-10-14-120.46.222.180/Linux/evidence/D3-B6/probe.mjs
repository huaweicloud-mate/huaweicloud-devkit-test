// D3-B6 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { callTool, TOOL_DEFINITIONS } = await import('file://' + HDKS + '/tools.mjs');
  const queries = [
    ['对象存储 OBS 桶 上传', 'obs'],
    ['ecs 创建云服务器 配额', 'ecs'],
    ['虚拟私有云 VPC 子网', 'vpc'],
    ['数据库 RDS 实例', 'rds'],
    ['IAM 用户权限', 'iam'],
  ];
  let hit = 0;
  const detail = [];
  for (const [q] of queries) {
    const r = await callTool('huaweicloud_search_docs', { query: q });
    const ok = r && r.ok === true && r.count > 0;
    if (ok) hit += 1;
    detail.push(q + '=' + (r && r.count));
  }
  t('D3-B6', 'hit-rate', hit === queries.length, hit + '/' + queries.length, '5/5', detail.join('; '));
  const top = await callTool('huaweicloud_search_docs', { query: '对象存储' });
  const r0 = (top && top.results && top.results[0]) || {};
  t('D3-B6', 'relevance-scored', typeof r0.relevance === 'number' && r0.relevance > 0, r0.relevance, '>0', 'top=' + (r0.name || '') );

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-B6', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-B6', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-B6', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });
