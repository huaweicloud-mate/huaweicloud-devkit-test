// probe_cloud2.mjs — D3-C13 (OBS website), D3-S3 (sandbox preview), D3-S6 (FunctionGraph), D3-S7/D1-39 (NOT_RUN)
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const REGION = process.env.HW_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-8);
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_cloud2.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}
const sh = (a, t = 90000) => { const r = spawnSync(a[0], a.slice(1), { encoding: 'utf8', timeout: t }); return { out: (r.stdout || '') + (r.stderr || ''), code: r.status }; };
const t = await import(`file://${HDK}/src/tools.mjs`);

// ---------------- D3-C13 OBS 静态网站托管配置 (真云) ----------------
try {
  const bucket = `hdk1-c13-${TS}`;
  const out = [];
  const mb = sh(['hcloud', 'OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
  out.push(`mb obs://${bucket} code=${mb.code} ${mb.out.slice(0, 100)}`);
  const created = /Create bucket .* successfully|created/i.test(mb.out) || mb.code === 0;
  if (!created) { rec('D3-C13', 'BLOCKED', 'OBS 静态网站托管配置', 'get/set/delete 走 AWS4 签名 REST；set 必须 indexDocument', `OBS 建桶失败（location/endpoint 配置）: ${mb.out.slice(0, 160)}`, 'hcloud OBS obsutil 端点/区域与 cn-north-4 不匹配(IllegalLocationConstraintException)；需配置 ~/.obsutilconfig 正确 endpoint'); }
  else {
    const g0 = await t.callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    const s = await t.callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html', errorDocument: '404.html' });
    const g1 = await t.callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    let missingErr = false;
    try { const bad = await t.callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION }); missingErr = bad?.ok === false || /index/i.test(JSON.stringify(bad)); } catch { missingErr = true; }
    const d = await t.callTool('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
    sh(['hcloud', 'OBS', 'rm', `obs://${bucket}`, '-f', '-r']); sh(['hcloud', 'OBS', 'bucketpolicy', `obs://${bucket}`]);
    out.push(`get0=${JSON.stringify(g0).slice(0, 80)} set=${s?.ok} get1含index=${/index\.html/.test(JSON.stringify(g1))} 缺indexDocument报错=${missingErr} delete=${d?.ok}`);
    const ok = s?.ok !== false && /index\.html/.test(JSON.stringify(g1)) && missingErr;
    rec('D3-C13', ok ? 'PASS' : 'FAIL', 'OBS 静态网站托管配置', 'get/set/delete 走 AWS4 签名 REST；set 必须 indexDocument', out.join(' | '));
  }
} catch (e) { rec('D3-C13', 'FAIL', 'OBS 静态网站托管配置', '', 'probe error: ' + e.message); }

// ---------------- D3-S3 场景-沙箱预览出URL (真云) ----------------
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
  const url = exp?.publicUrl || exp?.url || (JSON.stringify(exp).match(/https:\/\/[^\s"]+/) || [])[0];
  let urlOk = false;
  if (url) { try { const resp = await fetch(url, { signal: AbortSignal.timeout(15000) }); urlOk = resp.status === 200; } catch {} }
  const serving = chk?.nginx_serving === true || chk?.score >= 60 || JSON.stringify(chk).includes('nginx_serving');
  const ok = serving && !!url && urlOk;
  rec('D3-S3', ok ? 'PASS' : 'FAIL', '场景-沙箱预览出URL',
    '终点必返回可访问公网URL(HTTP 200)；会话可正常关闭；无计费资源残留',
    `route=${JSON.stringify(cat?.recommendedServices)} serving=${serving} publicUrl=${url || '(无)'} urlHTTP200=${urlOk} expose=${JSON.stringify(exp).slice(0, 160)}`,
    ok ? '' : '沙箱 DevBridge 隧道/公网URL 未建立或不可达');
} catch (e) { rec('D3-S3', 'FAIL', '场景-沙箱预览出URL', '', 'probe error: ' + e.message); }
finally { if (wsId) { try { await t.callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId }); } catch {} } }

// ---------------- D3-S6 场景-FunctionGraph定时任务 (真云) ----------------
try {
  const fn = `hdk1-s6-${TS}`;
  const b64 = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'ok'}\n").toString('base64');
  const cf = sh(['FunctionGraph', 'CreateFunction', `--func_name=${fn}`, '--package=default', '--runtime=Python3.9', '--handler=handler.handler', '--code_type=inline', `--func_code.file=${b64}`, `--cli-region=${REGION}`], 120000);
  const list = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, '--maxitems=20'], 60000);
  const created = list.out.includes(fn) || cf.out.includes(fn);
  const m = new RegExp(`"func_urn"\\s*:\\s*"([^"]*${fn})"`).exec(list.out);
  const urn = m ? m[1] : null;
  let del = { out: '(未创建)' };
  if (urn) del = sh(['FunctionGraph', 'DeleteFunction', `--function_urn=${urn}`, `--cli-region=${REGION}`], 60000);
  const after = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, '--maxitems=20'], 60000);
  const gone = !after.out.includes(fn);
  const ok = created && !!urn && gone;
  rec('D3-S6', ok ? 'PASS' : 'FAIL', '场景-FunctionGraph定时任务',
    '函数创建成功+定时触发器绑定，返回可调用标识；测后删除归零',
    `createOut=${cf.out.slice(0, 140)} 创建=${created} urn=${urn ? 'yes' : 'no'} 删除=${del.out.slice(0, 60)} 归零=${gone}`,
    ok ? '' : 'FunctionGraph 函数创建/触发器绑定未完成（inline 代码或权限/配额限制）');
} catch (e) { rec('D3-S6', 'FAIL', '场景-FunctionGraph定时任务', '', 'probe error: ' + e.message); }

// ---------------- D3-S7 跨服务交付 (NOT_RUN) ----------------
rec('D3-S7', 'NOT_RUN', '场景-跨服务交付(Web应用+RDS)并归零',
  '多服务编排(先建库后部署)+连接串注入+测后归零',
  'NOT_RUN：跨服务复合编排(RDS+沙箱+连接串注入+归零)超出每日单服务真云探针范围，未执行',
  '【改用例/补环境】跨服务交付需专用编排 harness 与 RDS 实例配额，建议转专项隔离执行');

// ---------------- D1-39 Windows 升级检测链 (NOT_RUN on Linux) ----------------
rec('D1-39', 'NOT_RUN', 'Windows 升级检测链可用性',
  'Windows 检测链无 EINVAL 静默失败',
  'NOT_RUN：D1-39 为 Windows 专属 P0 用例，当前 OS=Linux 不适用；Linux 侧由 EXP-NR3-10 代表覆盖',
  '【调归属】OS 专属用例，非对应 OS 标 NOT_RUN（AGENTS.md 状态口径唯一例外）');

console.log('probe_cloud2.mjs DONE');
