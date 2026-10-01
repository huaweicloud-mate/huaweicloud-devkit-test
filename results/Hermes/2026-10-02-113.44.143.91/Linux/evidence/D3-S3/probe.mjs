// D3-S3 场景-沙箱预览出URL 聚焦探针（真机 sandbox 连接→上传→部署→公网URL校验→关闭）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR || process.cwd();
const { callTool } = await import(`file://${HDK}/src/tools.mjs`);

const out = [];
let wsId = null;
let status = 'FAIL';
let why = '';
try {
  const cu = await callTool('huaweicloud_sandbox_check_user', {});
  out.push(`check_user realname=${cu?.realnameVerified} agreement=${cu?.agreementSigned}`);
  const conn = await callTool('huaweicloud_sandbox_connect', { source: 'CLI' });
  wsId = conn?.devStageId || conn?.sessionId;
  out.push(`sandbox_connect status=${conn?.status} wsId=${wsId ? String(wsId).slice(0,10) : '(无)'}`);

  const proj = join(tmpdir(), 'd3s3-preview');
  mkdirSync(proj, { recursive: true });
  writeFileSync(join(proj, 'index.html'), '<!DOCTYPE html><html><body><h1>hdk-d3s3-preview</h1></body></html>');
  const up = await callTool('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
  out.push(`upload_project ok=${up?.ok} md5Verified=${up?.md5Verified}`);
  const dn = await callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'd3s3-preview', output_dir: '.', workspace_id: wsId });
  out.push(`deploy_nginx ok=${dn?.ok} type=${dn?.nginxType}`);
  const dc = await callTool('huaweicloud_sandbox_deploy_check', { port: 8080, project: 'd3s3-preview', output_dir: '.', workspace_id: wsId });
  out.push(`deploy_check nginx_serving=${dc?.checks?.nginx_serving?.status} devbridge_tunnel=${dc?.checks?.devbridge_tunnel?.status} tunnel_url_accessible=${dc?.checks?.tunnel_url_accessible?.status} publicUrl=${dc?.publicUrl}`);
  await callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId });

  const nginxOk = dc?.checks?.nginx_serving?.status === 'PASS';
  const tunnelOk = dc?.checks?.tunnel_url_accessible?.status === 'PASS';
  const urlOk = typeof dc?.publicUrl === 'string' && dc.publicUrl.length > 0;
  status = (dn?.ok === true && nginxOk && tunnelOk && urlOk) ? 'PASS' : 'FAIL';
  if (status === 'FAIL') why = '沙箱 deploy_check devbridge_tunnel/tunnel_url_accessible=FAIL，publicUrl 缺失，公网预览 URL 链路未通';
} catch (e) {
  out.push(`异常: ${e.message}`);
  status = 'FAIL'; why = '异常: ' + e.message;
  if (wsId) { try { await callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId }); } catch {} }
}

const obj = { status, why: why || undefined, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL(`file://${EVID}/D3-S3/stdout.log`), JSON.stringify(obj, null, 2), 'utf8');
writeFileSync(new URL(`file://${EVID}/D3-S3/stdout.txt`), out.join('\n'), 'utf8');
console.log('D3-S3 => ' + status);
console.log(out.join('\n'));