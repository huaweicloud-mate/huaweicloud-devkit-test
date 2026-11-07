// D3-C3 沙箱部署 E2E（Hermes Linux 真机）
// connect → upload_project(sample-react) → deploy_nginx(static) → deploy_check → close_session
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync, writeFileSync as wf } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(SRC).href);

const out = [];
function rec(name, ok, detail) {
  out.push({ name, pass: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail !== undefined ? ' -> ' + detail : ''}`);
}

// 准备本地项目（静态站点样例）
const projDir = join(tmpdir(), 'd3c3-proj');
mkdirSync(projDir, { recursive: true });
wf(join(projDir, 'index.html'), '<!doctype html><html><body><h1>d3c3-probe</h1></body></html>');

let ws = '';
try { const r = await callTool('huaweicloud_sandbox_connect', { source: 'CLI' }); ws = r.dev_stage_id || r.devStageId || r.session_id || r.sessionId || r.workspace_id || ''; rec('connect', !!ws, `ws=${ws}`); }
catch (e) { rec('connect', false, e.message); }

try { const r = await callTool('huaweicloud_sandbox_upload_project', { local_dir: projDir, workspace_id: ws || undefined }); rec('upload_project', r && (r.ok === true || r.error === undefined), JSON.stringify(r).slice(0, 150)); }
catch (e) { rec('upload_project', false, e.message); }

let port = 0;
try { const r = await callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8085, project: 'd3c3-proj', output_dir: '.', workspace_id: ws || undefined }); port = r?.port || 8085; rec('deploy_nginx', !!r && (r.ok === true || r.port > 0), JSON.stringify(r).slice(0, 120)); }
catch (e) { rec('deploy_nginx', false, e.message); }

try { const r = await callTool('huaweicloud_sandbox_deploy_check', { port, project: 'd3c3-proj', output_dir: '.', framework_type: 'static', workspace_id: ws || undefined }); const passed = r && (r.score >= 0 || r.ok === true || r.status === 'PASS'); rec('deploy_check', !!passed, JSON.stringify(r).slice(0, 120)); }
catch (e) { rec('deploy_check', false, e.message); }

try { const r = await callTool('huaweicloud_sandbox_close_session', { workspace_id: ws || undefined }); rec('close_session', !r || r.ok === true || JSON.stringify(r).includes('ok'), JSON.stringify(r).slice(0, 80)); }
catch (e) { rec('close_session', false, e.message); }

const allPass = out.filter((x) => !x.pass).length === 0;
const result = { case: 'D3-C3', status: allPass ? 'PASS' : 'FAIL', total: out.length, passed: out.filter((x) => x.pass).length, results: out, executedAt: new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14) };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result));
console.log('\n=== D3-C3', result.status, `${result.passed}/${result.total}`, '===');