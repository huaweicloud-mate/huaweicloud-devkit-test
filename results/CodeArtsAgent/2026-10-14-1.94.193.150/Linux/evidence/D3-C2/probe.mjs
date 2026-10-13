// D3-C2 OBS 静态站部署 E2E（CodeArtsAgent Linux 每日回归，真机建删归零）
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
const CORE = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const bucket = 'tctest-c2-' + Date.now().toString(36).slice(-6).toLowerCase();
const REGION = 'cn-north-4';
const results = [];
function rec(n, ok, out) { results.push({ n, ok, out: String(out).slice(0, 260) }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${n}`); }
function sh(cmd) { try { return { ok: true, out: execSync(cmd, { encoding: 'utf8', timeout: 60000, maxBuffer: 5 * 1024 * 1024 }) }; } catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || '') }; } }

// 1. setup_obs_config 同步凭证
const sc = await callTool('huaweicloud_setup_obs_config', {});
rec('setup_obs_config 同步 OBS 凭证', sc?.ok === true || sc?.created === true || sc?.existed === true, JSON.stringify(sc).slice(0, 120));

// 2. 建桶
const mb = sh('hcloud obs mb obs://' + bucket + ' --location=' + REGION);
const mbOk = /Create bucket.*successfully/i.test(mb.out);
rec('创建 OBS 桶 ' + bucket, mbOk, mb.out.slice(0, 200));

// 3. 上传 index.html
const html = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/huaweicloud-devkit-test/results/CodeArtsAgent/2026-10-14-1.94.193.150/Linux/evidence/D3-C2/index.html';
const cp = sh('hcloud obs cp "' + html + '" obs://' + bucket + '/index.html');
const cpOk = /Upload successfully/i.test(cp.out) || /status \[200\]/.test(cp.out);
rec('上传 index.html', mbOk && cpOk, cp.out.slice(-160));

// 4. 设置静态网站托管
const wset = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket: bucket, region: REGION, indexDocument: 'index.html' });
rec('obs_set_website_config set', !wset?.__error && (wset?.ok === true || wset?.websiteUrl || wset?.note !== undefined), JSON.stringify(wset).slice(0, 200));

// 5. 查询验证
const wget = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket: bucket, region: REGION });
rec('obs_set_website_config get 验证', !wget?.__error && JSON.stringify(wget).includes('index.html'), JSON.stringify(wget).slice(0, 200));

// 6. 删除归零（清空对象 + 删桶）
const rm = sh('hcloud obs rm obs://' + bucket + ' -r -f');
const rb = sh('hcloud obs rb obs://' + bucket + ' -f');
rec('删除 OBS 桶归零', /successfully/i.test(rb.out) || /Delete bucket/i.test(rb.out), rb.out.slice(-160));

// 7. 归零验证
const ls = sh('hcloud obs ls');
const zeroed = !ls.out.includes(bucket);
rec('归零验证(ls 不含本次桶)', zeroed, JSON.stringify({ containsOwn: !zeroed }));

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId: 'D3-C2', bucket: bucket, total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));
process.exit(0);
