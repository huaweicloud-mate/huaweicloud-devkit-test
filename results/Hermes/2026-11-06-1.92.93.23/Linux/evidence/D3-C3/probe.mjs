// D3-C3 — 沙箱部署 E2E（真云：connect → upload → deploy_nginx → deploy_check(实际端口) → close）
// 关键：deploy_check 使用 deploy_nginx 返回的「实际端口」（auto-increment 后），非请求端口——源码契约 tools.mjs 明确要求。
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const checks = [];
function ck(name, ok, detail) { checks.push({ name, ok: !!ok, detail: String(detail || '').slice(0, 240) }); }

let wsId = null, closed = false;
try {
  const proj = '/tmp/d3c3-proj-' + String(Date.now()).slice(-6);
  mkdirSync(proj, { recursive: true });
  writeFileSync(join(proj, 'index.html'), '<!DOCTYPE html><html><body><h1>hdk-d3c3</h1></body></html>');

  const conn = await callTool('huaweicloud_sandbox_connect', { source: 'CLI' });
  wsId = conn?.devStageId || conn?.sessionId;
  ck('sandbox connect', conn?.status === 'connected' && !!wsId, 'ws=' + (wsId || '').slice(0, 10) + ' status=' + conn?.status);

  const up = await callTool('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
  ck('upload_project', up?.ok === true, JSON.stringify(up).slice(0, 140));

  const dn = await callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: proj.split('/').pop(), output_dir: '.', workspace_id: wsId });
  const actualPort = dn?.port;
  ck('deploy_nginx', dn?.ok === true && !!actualPort, dn?.nginxType + ':' + actualPort);

  const dc = await callTool('huaweicloud_sandbox_deploy_check', { port: actualPort, project: proj.split('/').pop(), output_dir: '.', workspace_id: wsId });
  const serving = dc?.checks?.nginx_serving?.status;
  ck('deploy_check(实际端口) nginx_serving', serving === 'PASS', 'port=' + actualPort + ' serving=' + serving + ' score=' + dc?.score);
} finally {
  if (wsId) {
    const cs = await callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId });
    closed = !cs?.__error;
    ck('close_session', closed, JSON.stringify(cs).slice(0, 80));
  }
}
const pass = checks.every((c) => c.ok);
const result = { caseId: 'D3-C3', status: pass ? 'PASS' : 'FAIL', why: checks.map((c) => (c.ok ? 'P' : 'F') + ':' + c.name).join(' '), executedAt: now14(), checks };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log('D3-C3', result.status, result.why);