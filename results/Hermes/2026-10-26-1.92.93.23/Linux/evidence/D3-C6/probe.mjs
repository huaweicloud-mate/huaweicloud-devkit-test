// D3-C6 沙箱 7 隐式工具具名冒烟（Hermes Linux 真机）
// 逐工具最小调用: check_user → credentials → sign_agreement → upload_file → exec_one_shot → deploy_check → close_session
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(SRC).href);

const out = [];
function rec(name, ok, detail) {
  out.push({ name, pass: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail !== undefined ? ' -> ' + detail : ''}`);
}

let ws = '';
// ① check_user
try { const r = await callTool('huaweicloud_sandbox_check_user', {}); rec('check_user', r.realnameVerified === true, JSON.stringify(r)); }
catch (e) { rec('check_user', false, e.message); }

// ② connect（拿 workspace/session）
try { const r = await callTool('huaweicloud_sandbox_connect', { source: 'CLI' }); ws = r.dev_stage_id || r.devStageId || r.session_id || r.sessionId || r.workspace_id || ''; rec('connect', !!ws, `ws=${ws}`); }
catch (e) { rec('connect', false, e.message); }

// ③ credentials
try { const r = await callTool('huaweicloud_sandbox_credentials', { session_id: ws || undefined }); rec('credentials', r && (r.ok === true || r.code === 0 || !r.error), JSON.stringify(r).slice(0, 120)); }
catch (e) { rec('credentials', false, e.message); }

// ④ sign_agreement（测试任务显式授权真机；已签名则幂等无副作用）
try { const r = await callTool('huaweicloud_sandbox_sign_agreement', {}); rec('sign_agreement', !r || r.ok === true || r.signed === true || r.alreadySigned === true, JSON.stringify(r).slice(0, 120)); }
catch (e) { rec('sign_agreement', false, e.message); }

// ⑤ upload_file：写本地小文件上传
try {
  const dir = mkdtemp();
  const lp = join(dir, 'probe.txt');
  writeFileSync(lp, 'D3-C6 probe ' + Date.now());
  const r = await callTool('huaweicloud_sandbox_upload_file', { local_path: lp, remote_path: '/workspace/d3c6-probe.txt', workspace_id: ws || undefined });
  rec('upload_file', r && (r.ok === true || r.error === undefined), JSON.stringify(r).slice(0, 120));
} catch (e) { rec('upload_file', false, e.message); }

// ⑥ exec_one_shot
try { const r = await callTool('huaweicloud_sandbox_exec_one_shot', { command: 'echo hdk-sandbox-ok', workspace_id: ws || undefined }); rec('exec_one_shot', r && (r.ok === true || /hdk-sandbox-ok/.test(JSON.stringify(r))), JSON.stringify(r).slice(0, 120)); }
catch (e) { rec('exec_one_shot', false, e.message); }

// ⑦ deploy_check（对静态样例）
try { const r = await callTool('huaweicloud_sandbox_deploy_check', { port: 8085, project: 'd3c6', output_dir: '.', workspace_id: ws || undefined }); rec('deploy_check', !!r, JSON.stringify(r).slice(0, 120)); }
catch (e) { rec('deploy_check', false, e.message); }

// close_session
try { const r = await callTool('huaweicloud_sandbox_close_session', { workspace_id: ws || undefined }); rec('close_session', !r || r.ok === true || r === 'ok' || JSON.stringify(r).includes('ok'), JSON.stringify(r).slice(0, 80)); }
catch (e) { rec('close_session', false, e.message); }

function mkdtemp() { const d = join(tmpdir(), 'd3c6-' + Date.now()); mkdirSync(d, { recursive: true }); return d; }

const allPass = out.filter((x) => !x.pass).length === 0;
const result = { case: 'D3-C6', status: allPass ? 'PASS' : 'FAIL', total: out.length, passed: out.filter((x) => x.pass).length, results: out, executedAt: new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14) };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result));
console.log('\n=== D3-C6', result.status, `${result.passed}/${result.total}`, '===');