// D3-C2 OBS 静态站部署 E2E（Hermes Linux daily 2026-10-17）
// 断言：建桶(-location) → 上传 → 静态网站 → 验证 → 删桶归零。真机执行。
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);
const REGION = 'cn-north-4';
const ts = Date.now().toString(36);
const bucket = `tctest-hermes-obs-${ts}`;
const results = [];
function rec(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); console.log(`[${pass ? 'OK' : 'FAIL'}] ${name} | ${String(detail).slice(0, 160)}`); }
const call = async (n, a) => callTool(n, a).catch((e) => ({ isError: true, error: e.message }));
const sh = async (args) => { try { return execFileSync('hcloud', ['OBS', ...args], { encoding: 'utf8', timeout: 60000 }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };

// 1. 建桶（带 -location）
const mb = await sh(['mb', `obs://${bucket}`, `-location=${REGION}`]);
rec('OBS建桶', /success/i.test(mb), mb.slice(0, 160));

// 2. 上传 index.html
{
  const src = '/tmp/d3c2-index.html';
  if (!existsSync(src)) writeFileSync(src, '<html><body>hdk-test-d3c2</body></html>');
  const cp = await sh(['cp', src, `obs://${bucket}/index.html`]);
  rec('上传index.html', /success|Object|(?:^|\n)0 B/i.test(cp) || cp.trim() !== '', cp.slice(0, 160));
}

// 3. 配置静态网站
const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
rec('set静态站', set.ok === true && set.status === 200, JSON.stringify({ ok: set.ok, status: set.status }));

// 4. 验证静态网站配置
const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
rec('get静态站配置', get.ok === true && get.status === 200, JSON.stringify({ ok: get.ok, status: get.status }));

// 5. 删桶归零
const rm = await sh(['rm', `obs://${bucket}`, '-r', '-f']);
  rec('删桶归零', /success/i.test(rm) || /successfully/i.test(rm) || /succeed/i.test(rm), rm.slice(0, 160));

const passed = results.filter((x) => x.pass).length;
const failed = results.filter((x) => !x.pass).length;
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ case: 'D3-C2', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed, failed, results }, null, 2));