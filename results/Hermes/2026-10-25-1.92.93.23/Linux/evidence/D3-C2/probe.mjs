// D3-C2 OBS 静态站部署 E2E（Hermes Linux 真机）
// 建桶 → 上传 index.html → public-read + set website → get website → curl 200 → 删桶归零
import { pathToFileURL } from 'node:url';
import { writeFileSync, writeFileSync as wf } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(SRC).href);
const REGION = 'cn-north-4';

const out = [];
function rec(name, ok, detail) {
  out.push({ name, pass: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail !== undefined ? ' -> ' + detail : ''}`);
}

function redact(v) { return String(v).replace(/(HPUA|AKIA|ASIA)[A-Za-z0-9]{8,}/g, '$1***').replace(/("(?:sk|secretKey|securityToken)")\s*:\s*"[^"]+"/gi, '$1:"***"'); }

const bucket = 'tctest-hermes-obs-' + Date.now().toString(36).slice(-6);
const localHtml = join(tmpdir(), 'index-' + Date.now() + '.html');
wf(localHtml, '<!doctype html><html><body><h1>tctest d3c2</h1></body></html>');
const runW = async (args, timeout = 60000) => {
  const plan = await callTool('huaweicloud_plan_cli_command', { args, timeoutMs: 30000 });
  return callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: timeout });
};

// ① 建桶
try {
  const r = await runW(['OBS', 'mb', 'obs://' + bucket, '--location=' + REGION]);
  const ok = r && (r.ok === true || /successfully|success/i.test(redact(r.stdout || r.output || '')));
  rec('OBS建桶', ok, redact(r?.stdout || r?.message || '').slice(0, 150));
} catch (e) { rec('OBS建桶', false, e.message); }

// ② 上传 index.html
try {
  const r = await runW(['OBS', 'cp', localHtml, 'obs://' + bucket + '/index.html']);
  const ok = r && (r.ok === true || /successfully|success/i.test(redact(r.stdout || '')));
  rec('obsutil上传', ok, redact(r?.stdout || r?.message || '').slice(0, 150));
} catch (e) { rec('obsutil上传', false, e.message); }

// ③ public-read（obsutil chattri 设置桶 + 对象 ACL=public-read）
try {
  execSync(`hcloud obs chattri obs://${bucket} -acl=public-read -f`, { encoding: 'utf8', stdio: 'pipe' });
  execSync(`hcloud obs chattri obs://${bucket}/index.html -acl=public-read -f`, { encoding: 'utf8', stdio: 'pipe' });
  rec('public-read(ACL)', true, '桶+对象 chattri -acl=public-read 已执行');
} catch (e) { rec('public-read(ACL)', false, e.message); }

// ④ set website（工具内部 AWS4 签名）
let websiteUrl = '';
try {
  const r = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
  websiteUrl = r?.websiteUrl || '';
  rec('set静态站(website)', r && (r.ok === true || r.status === 200), redact(JSON.stringify(r)).slice(0, 200));
} catch (e) { rec('set静态站', false, e.message); }

// ④ get website
try {
  const r = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
  rec('get静态站', r && (r.ok === true || r.status === 200), redact(JSON.stringify(r)).slice(0, 200));
} catch (e) { rec('get静态站', false, e.message); }

// ⑤ curl 200（website 传播，重试）
try {
  const url = websiteUrl || `http://${bucket}.obs-website.${REGION}.myhuaweicloud.com/index.html`;
  let code = '';
  for (let i = 0; i < 12; i++) {
    code = execSync(`curl -s -o /dev/null -w "%{http_code}" --max-time 20 "${url}"`, { encoding: 'utf8' }).trim();
    if (code === '200') break;
    await new Promise((r) => setTimeout(r, 8000));
  }
  rec('curl200', code === '200', `code=${code} url=${url}`);
} catch (e) { rec('curl200', false, e.message); }

// ⑥ 删桶归零（obsutil rm 支持删对象与删空桶）
try {
  execSync(`hcloud obs rm obs://${bucket}/ -r -f`, { encoding: 'utf8', stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 2000));
  execSync(`hcloud obs rm obs://${bucket} -f`, { encoding: 'utf8', stdio: 'pipe' });
  rec('删桶归零', true, 'rm -r -f 清对象 + rm obs://bucket -f 删桶');
} catch (e) { rec('删桶归零', false, e.message); }

const allPass = out.filter((x) => !x.pass).length === 0;
const result = { case: 'D3-C2', status: allPass ? 'PASS' : 'FAIL', total: out.length, passed: out.filter((x) => x.pass).length, results: out, executedAt: new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14) };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log('\n=== D3-C2', result.status, `${result.passed}/${result.total}`, '===');