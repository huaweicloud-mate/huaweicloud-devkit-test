// D3-C10 — real hdk probe (市场分类列表)
import { writeFileSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
async function main() {
  const { callTool } = await import('file://' + HDKS + '/tools.mjs');
  const sm = await import('file://' + HDKS + '/search-market.mjs');
  let catRes = null, cerr = '';
  try { catRes = await sm.getMarketplaceCategories(); } catch (e) { cerr = e.message; }
  const apiOk = catRes && catRes.ok === true && Array.isArray(catRes.categories);
  const list = catRes && Array.isArray(catRes.categories) ? catRes.categories : [];
  t('D3-C10', 'categories-api-responds', apiOk === true, catRes ? 'ok=true categories.length=' + list.length : 'ERR:' + cerr.slice(0, 140), 'ok=true + array', cerr ? 'fetch error: ' + cerr : '');
  t('D3-C10', 'categories-list-complete', list.length > 0, list.length, '>0 categories', '市场 index.json categories 为空/缺失 → 分类列表不完整 (真实缺口)');
  let fOk = false;
  try {
    const catVal = (list[0] && (list[0].id || list[0].name || list[0])) || '';
    const f = await callTool('huaweicloud_search_marketplace', { query: '', category: String(catVal) });
    fOk = f && f.ok === true && Array.isArray(f.results);
  } catch (e) {}
  t('D3-C10', 'filter-consistent', list.length > 0 ? fOk : null, list.length > 0 ? String(fOk) : 'blocked-by-empty-categories', list.length > 0 ? true : 'depends on non-empty categories', '按分类过滤返回结果数组');
}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const payload = { case: 'D3-C10', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify({ case: 'D3-C10', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-C10', name: 'probe-error', pass: false, actual: String((e && e.message) || e) }] }, null, 2), 'utf8');
    process.exit(1);
  });