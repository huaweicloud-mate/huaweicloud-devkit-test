// 2026-09-20 OpenClaw Linux — D3-S3 沙箱预览出公网URL 真机 E2E 探针
// ①serviceCatalog 路由→sandbox ②check_user ③connect ④upload_project ⑤deploy_nginx ⑥devbridge 暴露 ⑦HTTP 200 ⑧close_session
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CORE = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
let pass = 0, fail = 0;
const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function note(m) { lines.push(`NOTE   ${m}`); }

const { callTool } = await import(CORE + '/tools.mjs');

// ① serviceCatalog 路由（部署意图 → sandbox 置前）
{
  const r = await callTool('huaweicloud_service_catalog', { intent: '部署一个网站' });
  check('D3-S3', 'serviceCatalog 部署意图命中 sandbox 技能', r?.recommendedSkills?.includes('huawei-sandbox'), true);
  check('D3-S3', 'sandbox 在 deploymentIntent 下置前', (r?.recommendedSkills || [])[0] === 'huawei-sandbox', true);
}

// ② ③ check_user + connect
let sessionId = null, workspaceId = null;
{
  const cu = await callTool('huaweicloud_sandbox_check_user', {});
  check('D3-S3', 'check_user realname+agreement 就绪', cu?.realnameVerified === true && cu?.agreementSigned === true, true);

  const conn = await callTool('huaweicloud_sandbox_connect', { source: 'CLI' });
  sessionId = conn?.sessionId || null;
  workspaceId = conn?.workspaceId || conn?.devStageId || sessionId;
  note(`D3-S3 connect: sessionId=${!!sessionId} workspaceId=${workspaceId} status=${conn?.status}`);
  check('D3-S3', 'connect 返回 sessionId', typeof sessionId === 'string' && sessionId.length > 0, true);
  check('D3-S3', 'connect 返回可访问 connectionAddress(wss)', /^wss?:\/\//.test(conn?.connectionAddress || ''), true);
}

// ④⑤⑥⑦⑧ 上传/部署/暴露/验证/关闭
{
  const project = mkdtempSync(join(tmpdir(), 'hdk-s3-'));
  const site = join(project, 'site');
  mkdirSync(site, { recursive: true });
  writeFileSync(join(site, 'index.html'), '<!doctype html><html><body><h1>tctest-s3-preview</h1></body></html>');
  const projName = 'site';

  // 注入凭证（devbridge login 需要）
  try { const cr = await callTool('huaweicloud_sandbox_credentials', { workspace_id: workspaceId }); note(`D3-S3 sandbox_credentials ok=${cr?.ok}`); } catch (e) { note(`D3-S3 sandbox_credentials 抛错: ${String(e?.message || e).slice(0, 120)}`); }

  // upload_project
  let uploaded = false;
  try {
    const up = await callTool('huaweicloud_sandbox_upload_project', { local_dir: site, remote_dir: '/workspace' });
    uploaded = !!up && up.ok === true;
    note(`D3-S3 upload_project ok=${uploaded} md5Verified=${up?.md5Verified}`);
  } catch (e) { note(`D3-S3 upload_project 抛错: ${String(e?.message || e).slice(0, 160)}`); }
  check('D3-S3', 'upload_project 上传成功', uploaded, true);

  // deploy_nginx
  let nginxOk = false, actualPort = null;
  try {
    const dep = await callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: projName, output_dir: '.', workspace_id: workspaceId });
    nginxOk = !!dep && dep.ok === true;
    actualPort = dep?.port || 8080;
    note(`D3-S3 deploy_nginx => port=${actualPort} ok=${nginxOk}`);
  } catch (e) { note(`D3-S3 deploy_nginx 抛错: ${String(e?.message || e).slice(0, 160)}`); }
  check('D3-S3', 'deploy_nginx 执行成功', nginxOk, true);

  // devbridge expose 公网 URL
  let pubUrl = null;
  try {
    const login = await callTool('huaweicloud_sandbox_exec_one_shot', { command: 'source /tmp/hw_creds.sh 2>/dev/null; devbridge auth login --huaweicloud --access-key "$HW_ACCESS_KEY" --secret-key "$HW_SECRET_KEY" 2>&1 | tail -2', workspace_id: workspaceId });
    note(`D3-S3 devbridge login: ${JSON.stringify(login).slice(0, 200)}`);
    const host = await callTool('huaweicloud_sandbox_exec_one_shot', { command: `pkill -f "devbridge host" 2>/dev/null; sleep 1; nohup devbridge host -p ${actualPort} -e 8 > /tmp/host.log 2>&1 & sleep 12; cat /tmp/host.log`, workspace_id: workspaceId, timeout_ms: 60000 });
    const hostText = JSON.stringify(host);
    note(`D3-S3 devbridge host: ${hostText.slice(0, 320)}`);
    const m = hostText.match(/https:\/\/[A-Za-z0-9]+-[0-9]+\.cn-north-4-bridge\.myhuaweicloud\.com/);
    pubUrl = m ? m[0] : null;
  } catch (e) { note(`D3-S3 devbridge 抛错: ${String(e?.message || e).slice(0, 180)}`); }
  check('D3-S3', 'expose 返回公网 URL', typeof pubUrl === 'string' && /^https:\/\//.test(pubUrl), true);

  if (pubUrl) {
    let resp = -1;
    for (let i = 0; i < 4 && resp !== 200; i++) {
      resp = await fetch(pubUrl).then((r) => r.status).catch(() => -1);
      if (resp !== 200) await new Promise((r) => setTimeout(r, 3000));
    }
    note(`D3-S3 GET ${pubUrl} => HTTP ${resp}`);
    check('D3-S3', '公网 URL 可访问(HTTP 200)', resp, 200);
  }

  // close_session
  let closed = false;
  try {
    const cs = await callTool('huaweicloud_sandbox_close_session', { workspace_id: workspaceId });
    closed = !!cs;
    note(`D3-S3 close_session => ${JSON.stringify(cs).slice(0, 120)}`);
  } catch (e) { note(`D3-S3 close_session 抛错: ${String(e?.message || e).slice(0, 120)}`); }
  check('D3-S3', '会话可正常关闭', closed, true);
}

console.log('\n=== OpenClaw Linux D3-S3 沙箱预览出 URL 探针结果 (2026-09-20) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);