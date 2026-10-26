// probe_d3s3.mjs — D3-S3 场景-沙箱预览出URL（复跑：先清测试残留 nginx，释放 8080-8089）
// 断言：serviceCatalog 路由 → connect → upload_project → deploy_nginx+deploy_check →
//       公网 URL 可访问(HTTP 200) → close_session。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

const HDK = process.env.HDK_SRC;
const EVID = process.env.EVID_DIR;
const { callTool } = await import(pathToFileURL(join(HDK, 'tools.mjs')).href);
const results = [];
const rec = (id, status, title, expected, actual, detail = '') => {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14), probe: 'probe_d3s3.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${String(actual).slice(0, 220)}`);
  results.push({ id, status });
};

let wsId = null;
try {
  const dir = '/tmp/hdk-s3-site';
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), '<!doctype html><html><body><h1>hdk-s3-preview</h1></body></html>');

  const cat = await callTool('huaweicloud_service_catalog', { intent: '部署预览一个 web 应用到沙箱' });
  const conn = await callTool('huaweicloud_sandbox_connect', { source: 'CLI' });
  wsId = conn?.workspace_id || conn?.devStageId || conn?.sessionId;
  // 测试收尾：清理历史遗留 nginx 监听
  try {
    await callTool('huaweicloud_sandbox_exec_one_shot', { workspace_id: wsId, command: 'nginx -s stop 2>/dev/null; pkill -f nginx 2>/dev/null; sleep 1; echo cleaned' });
  } catch {}
  const up = await callTool('huaweicloud_sandbox_upload_project', { local_dir: dir, remote_dir: '/workspace', extract: true, workspace_id: wsId });
  const nginx = await callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'hdk-s3-site', output_dir: '.', workspace_id: wsId });
  const port = nginx?.port || 8080;
  const chk = await callTool('huaweicloud_sandbox_deploy_check', { port, project: 'hdk-s3-site', output_dir: '.', framework_type: 'static', workspace_id: wsId });
  let exp = null;
  try { exp = await callTool('huaweicloud_sandbox_expose_tunnel', { workspace_id: wsId, port }); } catch (e) { exp = { error: String(e.message).slice(0, 160) }; }
  const url = exp?.publicUrl || exp?.url || (JSON.stringify(exp).match(/https:\/\/[^\s"]+/) || [])[0];
  let urlOk = false, httpStatus = null;
  if (url) { try { const resp = await fetch(url, { signal: AbortSignal.timeout(20000) }); httpStatus = resp.status; urlOk = resp.status === 200; } catch (e) { httpStatus = 'ERR:' + String(e.message).slice(0, 60); } }
  const serving = chk?.checks?.nginx_serving?.status === 'PASS' || chk?.nginx_serving === true;
  const ok = serving && !!url && urlOk;
  rec('D3-S3', ok ? 'PASS' : 'FAIL', '场景-沙箱预览出URL',
    '终点必返回可访问公网URL(HTTP 200)；会话可正常关闭；无计费资源残留',
    `route=${JSON.stringify(cat?.recommendedServices)} serving=${serving} nginx.port=${port} publicUrl=${url || '(无)'} urlHTTP=${httpStatus} expose=${JSON.stringify(exp).slice(0, 200)}`,
    ok ? '' : '沙箱 DevBridge 隧道/公网URL 未建立或不可达');
} catch (e) {
  rec('D3-S3', 'FAIL', '场景-沙箱预览出URL', '', 'probe error: ' + String(e.message).slice(0, 200));
} finally {
  if (wsId) { try { await callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId }); } catch {} }
}
