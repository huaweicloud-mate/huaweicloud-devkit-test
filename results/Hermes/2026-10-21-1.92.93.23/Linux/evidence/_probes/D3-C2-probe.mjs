// D3-C2 OBS 静态站部署 E2E（Hermes Linux）—— 建桶→上传→website config→curl200→清理归零
// 说明：OBS mb 成功时 obsutil 会因「全局域名 Notice」返回 exit=6（非致命），故建桶断言按
//       stdout 含 "successfully" 判定，而非 exit code（修正 realcloud_e2e.mjs 的误判）。
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const BUCKET = `testbot2-hermes-obs-${TS}`;
const HDK_SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(HDK_SRC + '/tools.mjs').href);

const results = [];
function log(name, pass, detail) {
  results.push({ name, pass, detail: String(detail).slice(0, 300) });
  console.log(`[${pass ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + String(detail).slice(0, 180) : ''}`);
}
function sh(cmd, opts = {}) {
  const r = spawnSync('hcloud', cmd, { encoding: 'utf8', timeout: 90000, ...opts });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// ① 构建静态站
const proj = mkdtempSync(join(tmpdir(), 'd3c2-'));
writeFileSync(join(proj, 'index.html'), '<!DOCTYPE html><html><body><h1>hdk-d3c2-ok</h1></body></html>');
log('D3-C2 构建静态站', true, join(proj, 'index.html'));

// ② 建桶（assert stdout 含 successfully，允许 exit=6 的 Notice）
const mb = sh(['OBS', 'mb', `obs://${BUCKET}`, `-location=${REGION}`]);
log('D3-C2 OBS建桶', /success/i.test(mb.text), mb.text.slice(0, 120));

// ③ obsutil 上传 index.html（核对 -dryRun 键名语义：cp 上传）
const upRes = sh(['OBS', 'cp', join(proj, 'index.html'), `obs://${BUCKET}/index.html`]);
log('D3-C2 obsutil上传index.html', /success|Succeed/i.test(upRes.text), upRes.text.slice(0, 120));

// ④ public-read 静态站托管（obs_set_website_config set indexDocument）
const set = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket: BUCKET, region: REGION, indexDocument: 'index.html' });
log('D3-C2 set静态站(website config)', set?.ok === true && set?.status === 200, JSON.stringify(set).slice(0, 200));

// ⑤ get 回读 website config
const get = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket: BUCKET, region: REGION });
log('D3-C2 get静态站', get?.ok === true && get?.status === 200, JSON.stringify(get).slice(0, 200));

// ⑥ curl200（website URL，容忍 ~1min 传播，重试 6 次 ×10s）
const websiteUrl = `http://${BUCKET}.obs-website.${REGION}.myhuaweicloud.com/index.html`;
let curlOk = false, curlCode = '';
for (let i = 0; i < 6; i++) {
  const c = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', websiteUrl], { encoding: 'utf8', timeout: 20000 });
  curlCode = (c.stdout || '').trim();
  if (curlCode === '200') { curlOk = true; break; }
  await new Promise((r) => setTimeout(r, 10000));
}
log('D3-C2 curl200(静态站可访问)', curlOk, `http_code=${curlCode}`);

// ⑦ 清理归零：rm 桶（先删对象，再删桶），ListBuckets 不含本次桶
const rmObj = sh(['OBS', 'rm', `obs://${BUCKET}/index.html`, '-f']);
const rm = sh(['OBS', 'rm', `obs://${BUCKET}`, '-f']);
const list = sh(['OBS', 'ls', 'obs://', '-s']).text;
const residual = list.includes(BUCKET);
log('D3-C2 清理归零(删桶+ListBuckets无残留)', /success/i.test(rm.text) && !residual, rm.text.slice(0, 120) + (residual ? ' [残留!]' : ' [无残留]'));

const failed = results.filter(x => !x.pass).length;
const summary = { case: 'D3-C2', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results };
console.log('\n=== D3-C2 SUMMARY ===\n' + JSON.stringify(summary, null, 2));