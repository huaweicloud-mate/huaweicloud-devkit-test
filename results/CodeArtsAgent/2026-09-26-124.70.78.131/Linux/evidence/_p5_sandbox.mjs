// D3-S3 sandbox real-machine full chain
import { add, setStatus, flush, CORE } from './_util.mjs';
const { callTool } = await import(CORE + '/tools.mjs');
const DEMO = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/_sandbox_demo';
async function call(name, args) {
  try { const r = await callTool(name, args || {}); return { ok: true, r }; }
  catch (e) { return { ok: false, e: String(e.message || e) }; }
}
let wid = '';
const cu = await call('huaweicloud_sandbox_check_user', {});
add('D3-S3', 'check_user agreementSigned', !!(cu.r && cu.r.agreementSigned === true), JSON.stringify(cu.r || cu.e).slice(0, 160));
const cn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
if (!(cn.r && (cn.r.workspace_id || cn.r.connection_address || cn.r.sessionId || cn.r.session_id))) {
  add('D3-S3', 'connect 建立 workspace', false, JSON.stringify(cn.r || cn.e).slice(0, 200));
  setStatus('D3-S3', 'BLOCKED', 'sandbox_connect failed: ' + JSON.stringify(cn.r || cn.e).slice(0, 160));
  flush();
  process.exit(0);
}
wid = cn.r.workspace_id || cn.r.workspaceId || '';
const addr = cn.r.connection_address || cn.r.connectionAddress || '';
add('D3-S3', 'connect 建立 workspace', true, 'wid=' + wid + ' addr=' + String(addr).slice(0, 40));
const up = await call('huaweicloud_sandbox_upload_project', { local_dir: DEMO, workspace_id: wid || undefined });
add('D3-S3', 'upload_project 上传成功', !!(up.r && (up.r.ok === true || up.r.md5Verified === true || up.r.uploaded === true || up.r.status === 'ok')), JSON.stringify(up.r || up.e).slice(0, 160));
const ex = await call('huaweicloud_sandbox_exec_one_shot', { command: 'echo hello-d3s3', workspace_id: wid || undefined });
add('D3-S3', 'exec_one_shot 可执行', !!(ex.r && (ex.r.exitCode === 0 || ex.r.ok === true || ex.r.stdout)), JSON.stringify(ex.r || ex.e).slice(0, 160));
const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8092, project: '_sandbox_demo', output_dir: '.', workspace_id: wid || undefined });
add('D3-S3', 'deploy_nginx ok', !!(dn.r && (dn.r.ok === true || dn.r.exitCode === 0)), JSON.stringify(dn.r || dn.e).slice(0, 160));
const nginxPort = (dn.r && dn.r.port) || 8092;
const dc = await call('huaweicloud_sandbox_deploy_check', { port: nginxPort, project: '_sandbox_demo', output_dir: '.' });
const checks = (dc.r && dc.r.checks) || {};
const nginxOk = checks.nginx_serving && checks.nginx_serving.status === 'PASS';
add('D3-S3', 'deploy_check nginx_serving=PASS', nginxOk, JSON.stringify(dc.r || dc.e).slice(0, 200));
const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wid || undefined });
add('D3-S3', 'close_session 关闭', !!(cs.r && (cs.r === 'ok' || cs.r.ok === true || cs.r.status === 'ok' || cs.r.closed === true || JSON.stringify(cs.r).includes('ok'))), JSON.stringify(cs.r || cs.e).slice(0, 100));
flush();
