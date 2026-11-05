// D3-C2 — OBS 静态网站托管 E2E（真云：建桶 → 静态站 set/get → 删桶归零）
// 真实执行：hcloud OBS 建删桶 + callTool(huaweicloud_obs_set_website_config)。finally 反序删除 + 归零验证，只删本次创建。
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-8);
const BUCKET = `testbot3-hermes-obs-${TS}`;
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const checks = [];
function ck(name, ok, detail) { checks.push({ name, ok: !!ok, detail: String(detail || '').slice(0, 240) }); }
function sh(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 90000 });
  return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}
let bucketExists = false;
try {
  const mb = sh(['OBS', 'mb', `obs://${BUCKET}`, `-location=${REGION}`]);
  const mbOk = /success/i.test(mb.text);
  ck('OBS 建桶', mbOk, mb.text.slice(0, 160));
  bucketExists = mbOk;

  const set = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket: BUCKET, region: REGION, indexDocument: 'index.html' });
  ck('set 静态站', set?.ok === true && set?.status === 200, JSON.stringify(set).slice(0, 200));

  const get = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket: BUCKET, region: REGION });
  ck('get 静态站', get?.ok === true && get?.status === 200, JSON.stringify(get).slice(0, 160));
} finally {
  if (bucketExists) {
    const rm = sh(['OBS', 'rm', `obs://${BUCKET}`, '-f']);
    ck('删桶归零', /success/i.test(rm.text), rm.text.slice(0, 120));
    // 归零验证：ListBuckets 确认本次桶不在列表
    const ls = sh(['OBS', 'ls']);
    const stillThere = ls.text.includes(BUCKET);
    ck('归零复核(列表不含本次桶)', !stillThere, stillThere ? '仍存在:' + BUCKET : '已归零');
  }
}
const pass = checks.every((c) => c.ok);
const result = { caseId: 'D3-C2', status: pass ? 'PASS' : 'FAIL', why: checks.map((c) => (c.ok ? 'P' : 'F') + ':' + c.name).join(' '), executedAt: now14(), checks };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log('D3-C2', result.status, result.why);