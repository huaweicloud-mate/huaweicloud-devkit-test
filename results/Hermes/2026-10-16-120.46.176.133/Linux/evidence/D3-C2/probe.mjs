// probe.mjs — D3-C2 真云 E2E：OBS 建桶 → 静态网站托管配置 → 读回 → 删桶归零
// 本地修正版（2026-10-16）：`hcloud OBS mb` 在部分 KooCLI 版本上"成功仍返回非 0 退出码"，
// 原 scripts/realcloud_e2e.mjs 以退出码判建桶成败会把真实成功误判 FAIL（测试侧探针缺陷）。
// 本探针改为以命令输出文本（"Create bucket ... successfully"）判成败，并保留原始退出码供核对。
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const REGION = process.env.HW_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); }
const sh = (a, t = 120000) => { const r = spawnSync(a[0], a.slice(1), { encoding: 'utf8', timeout: t }); return { out: ((r.stdout || '') + (r.stderr || '')).trim(), code: r.status }; };
const { callTool } = await import(`file://${HDK}/src/tools.mjs`);
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }

const bucket = `testbot3-hermes-obs-${TS}`;
let created = false;
try {
  const mb = sh(['hcloud', 'OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
  // 不以退出码判成败（KooCLI `obs mb` 成功可返回非 0），以输出文本为准
  created = /created bucket|successfully/i.test(mb.out) && !/error|failed/i.test(mb.out);
  log('OBS建桶', created, `exitCode=${mb.code} out=${mb.out.slice(0, 200)}`);

  const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
  log('set静态站', set?.ok === true && set?.status === 200, JSON.stringify(set).slice(0, 240));

  const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
  log('get静态站', get?.ok === true && get?.status === 200, JSON.stringify(get).slice(0, 240));

  const rm = sh(['hcloud', 'OBS', 'rm', `obs://${bucket}`, '-f']);
  const gone = /successfully|removed/i.test(rm.out) && !/NoSuchBucket/i.test(rm.out);
  log('删桶归零', gone, `exitCode=${rm.code} out=${rm.out.slice(0, 160)}`);
} catch (e) {
  log('probe', false, 'error: ' + e.message);
} finally {
  // 兜底归零（只删本轮唯一时间戳桶）
  const chk = sh(['hcloud', 'obs', 'ls']);
  if (chk.out.includes(bucket)) {
    const rm2 = sh(['hcloud', 'OBS', 'rm', `obs://${bucket}`, '-f']);
    log('兜底归零', /successfully|removed/i.test(rm2.out), rm2.out.slice(0, 160));
  }
}

const failed = results.filter(r => !r.pass).length;
const d = join(EVID, 'D3-C2'); mkdirSync(d, { recursive: true });
writeFileSync(join(d, 'stdout.log'), JSON.stringify({
  status: failed === 0 ? 'PASS' : 'FAIL', caseId: 'D3-C2', title: 'OBS 静态网站托管 E2E',
  expected: '建桶→set/get 网站配置成功→删桶归零，无残留',
  total: results.length, passed: results.length - failed, failed,
  results, bucket, executedAt: now14(), probe: 'probe.mjs'
}, null, 2), 'utf8');
console.log(`D3-C2 ${failed === 0 ? 'PASS' : 'FAIL'} (${results.length - failed}/${results.length}) bucket=${bucket}`);
for (const r of results) console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail.slice(0, 160)}`);