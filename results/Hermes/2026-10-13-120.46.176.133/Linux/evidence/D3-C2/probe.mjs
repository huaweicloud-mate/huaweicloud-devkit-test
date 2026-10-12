#!/usr/bin/env node
// probe.mjs — D3-C2 OBS 静态网站部署 E2E（真云，建删归零）
// 步骤：①构建静态站 ②hcloud obs 上传(核对目录语义) ③public-read ④网站配置 set/get ⑤curl 站点 URL 断言 200 ⑥清理归零
// 修复：hcloud obs mb 成功时进程退出码=6（KooCLI obs 全局域名 Notice），断言改用输出文本而非退出码。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HW_REGION || 'cn-north-4';
const EVID = process.env.EVID_DIR;
const HDK_SRC = process.env.HDK_SRC || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const TS = String(Date.now()).slice(-10);
const BUCKET = `testbot3-hermes-c2-${TS}`;
const SITE = '/tmp/d3c2-site';

const { callTool } = await import(pathToFileURL(join(HDK_SRC, 'tools.mjs')).href);
const sh = (cmd) => { const r = spawnSync('hcloud', cmd, { encoding: 'utf8', timeout: 120000 }); return { code: r.status, out: ((r.stdout || '') + (r.stderr || '')).trim() }; };
const rec = [];
const log = (name, pass, detail) => { rec.push({ name, pass: !!pass, detail: String(detail).slice(0, 300) }); console.log(`${pass ? 'PASS' : 'FAIL'}\t${name}\t${detail}`); };
async function call(n, a) { try { return await callTool(n, a); } catch (e) { return { __error: String(e).slice(0, 260) }; } }

let objUploaded = false;
try {
  // ① 构建静态站
  mkdirSync(SITE, { recursive: true });
  writeFileSync(join(SITE, 'index.html'), '<!DOCTYPE html><html><head><title>hdk-d3c2</title></head><body><h1>hdk-d3c2-static-site</h1></body></html>');
  log('build_site', true, 'index.html written to ' + SITE);

  // ② 建桶 + 上传（hcloud obs 成功退出码可能为 6，按输出文本断言）
  const mb = sh(['obs', 'mb', `obs://${BUCKET}`, `-location=${REGION}`]);
  const mbOk = /successfully/i.test(mb.out) && !/error/i.test(mb.out.replace(/Notice[\s\S]*/, ''));
  log('create_bucket', mbOk, `exitCode=${mb.code} ${mb.out.slice(-160)}`);

  const cp = sh(['obs', 'cp', join(SITE, 'index.html'), `obs://${BUCKET}/`]);
  objUploaded = /Upload successfully|uploaded success/i.test(cp.out) || /100\.00%/i.test(cp.out);
  log('upload_index(目录语义 obs://bucket/)', objUploaded, `exitCode=${cp.code} ${cp.out.slice(-160)}`);

  const ls = sh(['obs', 'ls', `obs://${BUCKET}/`]);
  log('list_object', /index\.html/.test(ls.out), ls.out.slice(-160));

  // ③ public-read
  const ch = sh(['obs', 'chattri', `obs://${BUCKET}/index.html`, '-acl=public-read']);
  log('set_public_read', /successfully|OK/i.test(ch.out) && !/error/i.test(ch.out), `exitCode=${ch.code} ${ch.out.slice(-160)}`);

  // ④ 网站配置 set / get
  const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket: BUCKET, region: REGION, indexDocument: 'index.html' });
  log('website_set', set?.ok === true && set?.status === 200, JSON.stringify(set).slice(0, 200));
  const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket: BUCKET, region: REGION });
  log('website_get', get?.ok === true && /index\.html/.test(JSON.stringify(get)), JSON.stringify(get).slice(0, 200));

  // ⑤ curl 站点 URL 断言 200
  const siteUrl = `http://${BUCKET}.obs-website.${REGION}.myhuaweicloud.com/`;
  const curl = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '25', siteUrl], { encoding: 'utf8' });
  const code = (curl.stdout || '').trim();
  log('curl_website_200', code === '200', `${siteUrl} -> HTTP ${code}`);
} catch (e) {
  log('probe_error', false, e.message);
} finally {
  // ⑥ 清理归零：删对象 → 删桶 → ls 校验不存在
  const cleanup = [];
  try { if (objUploaded) { sh(['obs', 'rm', `obs://${BUCKET}/index.html`, '-f']); cleanup.push('rm-object'); } } catch {}
  try { await call('huaweicloud_obs_set_website_config', { action: 'delete', bucket: BUCKET, region: REGION }); } catch {}
  try { const d = sh(['obs', 'rm', `obs://${BUCKET}`, '-f']); cleanup.push('rm-bucket:' + (/successfully/i.test(d.out) ? 'ok' : d.out.slice(-80))); } catch {}
  const after = sh(['obs', 'ls']);
  const gone = !after.out.includes(BUCKET);
  cleanup.push('归零校验:' + (gone ? '已归零' : '仍残留'));
  log('cleanup_归零', gone, cleanup.join(' '));
}

const failed = rec.filter((x) => !x.pass).length;
const out = JSON.stringify({ status: failed === 0 ? 'PASS' : 'FAIL', caseId: 'D3-C2', title: 'OBS静态站部署E2E',
  expected: '静态站部署成功(上传+public-read+网站配置+curl200)且资源归零', total: rec.length, passed: rec.length - failed, failed, results: rec,
  executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14), probe: 'probe.mjs' }, null, 2);
if (EVID) { const d = join(EVID, 'D3-C2'); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), out, 'utf8'); }
console.log('\n' + out);
