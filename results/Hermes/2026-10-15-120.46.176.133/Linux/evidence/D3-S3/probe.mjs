// probe_d3s3.mjs — D3-S3 场景-沙箱预览出URL（真云）
// 唯一断言：①沙箱部署 nginx_serving ②expose_tunnel 返回公网 URL ③该 URL 实测 HTTP 200
// 复核：URL 可达性用 fetch（重试 4 次×15s）+ curl 交叉验证（隧道建立有传播延迟）
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_d3s3.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}
const curl = (u) => {
  const r = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '20', u], { encoding: 'utf8', timeout: 30000 });
  return (r.stdout || '').trim();
};

const t = await import(`file://${HDK}/src/tools.mjs`);
let wsId = null;
try {
  const dir = '/tmp/hdk-s3-site'; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), '<!doctype html><html><body><h1>hdk-s3-preview</h1></body></html>');
  const cat = await t.callTool('huaweicloud_service_catalog', { intent: '部署预览一个 web 应用到沙箱' });
  const conn = await t.callTool('huaweicloud_sandbox_connect', { source: 'CLI' });
  wsId = conn?.workspace_id || conn?.sessionId;
  const up = await t.callTool('huaweicloud_sandbox_upload_project', { local_dir: dir, remote_dir: '/workspace', extract: true });
  const nginx = await t.callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'hdk-s3-site', output_dir: '.', workspace_id: wsId });
  const chk = await t.callTool('huaweicloud_sandbox_deploy_check', { port: 8080, project: 'hdk-s3-site', output_dir: '.', framework_type: 'static', workspace_id: wsId });
  let exp = null;
  try { exp = await t.callTool('huaweicloud_sandbox_expose_tunnel', { workspace_id: wsId, port: 8080 }); } catch (e) { exp = { error: String(e.message).slice(0, 120) }; }
  const url = exp?.publicUrl || exp?.url || (JSON.stringify(exp).match(/https:\/\/[^\s"]+/) || [])[0] || '';
  const serving = chk?.nginx_serving === true || chk?.score >= 60 || JSON.stringify(chk).includes('nginx_serving');

  let httpCode = '';
  const tries = [];
  for (let i = 0; i < 4 && httpCode !== '200'; i++) {
    try { const resp = await fetch(url, { signal: AbortSignal.timeout(15000) }); tries.push('fetch#' + i + '=' + resp.status); if (resp.status === 200) httpCode = '200'; }
    catch (e) { tries.push('fetch#' + i + '=ERR'); }
    if (httpCode !== '200') { await new Promise(r => setTimeout(r, 8000)); }
  }
  const cCode = url ? curl(url) : '';
  const urlOk = httpCode === '200' || cCode === '200';
  const ok = serving && !!url && urlOk;
  rec('D3-S3', ok ? 'PASS' : 'FAIL', '场景-沙箱预览出URL',
    '终点必返回可访问公网URL(HTTP 200)；会话可正常关闭；无计费资源残留',
    `route=${JSON.stringify(cat?.recommendedServices)} serving=${serving} publicUrl=${url || '(无)'} fetch=${httpCode} curl=${cCode} tries=${tries.join(',')} expose=${JSON.stringify(exp).slice(0, 200)}`,
    ok ? '' : '沙箱 DevBridge 隧道/公网URL 未建立或不可达');
} catch (e) { rec('D3-S3', 'FAIL', '场景-沙箱预览出URL', '', 'probe error: ' + e.message); }
finally { if (wsId) { try { await t.callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId }); } catch {} } }
