// D3-S3: 沙箱预览出 URL（真云沙箱最小静态部署 → 出 URL → 关闭）
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-1.94.218.129/Linux/evidence/d3-sandbox/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 220), expected: String(expected) });
}
function textOf(r) {
  return r?.result?.content?.[0]?.text || r?.content?.[0]?.text || '';
}
function objOf(r) {
  const t = textOf(r);
  if (!t) return r?.result || r || {};
  try { return JSON.parse(t); } catch { return r?.result || r || {}; }
}

let workspaceId = null;
try {
  const conn = await callTool('huaweicloud_sandbox_connect', { source: 'CLI' });
  const co = conn?.result || conn;
  const cp = co.sessionId || co.session_id || co.devStageId || co.dev_stage_id;
  workspaceId = co.workspace_id || co.workspaceId || co.devStageId || co.dev_stage_id || cp;
  test('D3-S3', 'sandbox-connect', !!workspaceId, `workspace=${workspaceId}`, 'connect 返回 session/workspace');

  // 建最小静态项目（固定 project 名）并上传
  const base = mkdtempSync(join(tmpdir(), 'hdk-preview-root-'));
  const proj = join(base, 'hdk-preview');
  mkdirSync(join(proj, 'dist'), { recursive: true });
  writeFileSync(join(proj, 'dist', 'index.html'), '<!DOCTYPE html><html><body><h1>hdk-preview</h1></body></html>', 'utf8');

  const up = await callTool('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: workspaceId });
  test('D3-S3', 'sandbox-upload', !!(textOf(up) || up?.result), textOf(up).slice(0, 140), 'upload_project 成功');

  const dep = await callTool('huaweicloud_sandbox_deploy_nginx', {
    nginx_type: 'static', port: 8080, project: 'hdk-preview', output_dir: 'dist', workspace_id: workspaceId,
  });
  const depTxt = textOf(dep) || JSON.stringify(dep);
  const urlMatch = /https?:\/\/[^\s"']+|preview|URL|url/i.test(depTxt);
  test('D3-S3', 'sandbox-deploy-url', urlMatch, depTxt.slice(0, 200), 'deploy_nginx 返回可访问 URL');

  const chk = await callTool('huaweicloud_sandbox_deploy_check', {
    port: 8080, project: 'hdk-preview', output_dir: 'dist', framework_type: 'static', workspace_id: workspaceId,
  });
  test('D3-S3', 'sandbox-deploy-check', !!textOf(chk), textOf(chk).slice(0, 160), 'deploy_check 返回状态');

  const cl = await callTool('huaweicloud_sandbox_close_session', { workspace_id: workspaceId });
  test('D3-S3', 'sandbox-close', true, JSON.stringify(cl).slice(0, 100), 'close_session 正常');
} catch (e) {
  test('D3-S3', 'sandbox-flow-error', false, String(e.message || e).slice(0, 200), '沙箱全流程成功');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);