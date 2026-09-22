#!/usr/bin/env node
// 沙箱连通性 + 部署能力专项监控探针【黑盒模式】，确定性执行，无 LLM 扩展分析。
//
// 被测对象：huaweicloud-devkit（npm 全局安装包），通过其 MCP server（stdio JSON-RPC）
//          的 huaweicloud_sandbox_* 工具驱动华为云沙箱（DevStation）完成静态站部署。
//
// 场景：部署 https://gitcode.com/sunzy1940/test 静态网站到沙箱，验证「连通性」+「部署能力」。
//
// 黑盒路径（区别于源码直调 callTool）：
//   spawn 全局安装包内的 mcp-server.mjs → 发送 initialize / tools/list / tools/call，
//   工具返回在 result.content[0].text（JSON 字符串，需二次 JSON.parse）。
//
// 用法（在测试仓库根目录，已 export node/npm PATH 后）：
//   node scripts/sandbox-deploy-monitor.mjs [--evidence <落盘目录>]
//
// MCP server 定位：优先 HDK_MCP_SERVER 环境变量（mcp-server.mjs 绝对路径），
//   否则 `npm root -g` 动态定位全局包内的 mcp-server.mjs。
//
// 断言清单：
//   P0.mcp_server    initialize 成功且 serverInfo.name === huaweicloud-devkit（被测对象身份）
//   P1.tools_list    tools/list 返回且包含 7 个 huaweicloud_sandbox_* 工具
//   C1.check_user    实名认证 + 协议签署通过（连接前置）
//   C2.connect       连接沙箱成功，拿到 workspaceId
//   D1.clone         本地 clone gitcode.com/sunzy1940/test 成功
//   C3.exec_roundtrip 沙箱内执行命令回显（终端链路通）
//   D2.upload_project 项目上传成功且 md5 校验通过
//   D3.deploy_nginx  静态站 nginx 部署成功，返回端口
//   D4.nginx_serving deploy_check 判定 nginx 服务，且 curl 端口返回 2xx/3xx
//   观察：W1.publicUrl_domain（legacy 域名告警，不计失败）
//
// 退出码：0 = C/D/P 全部通过；1 = 存在 FAIL。
import { spawn, execSync, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const REPO_URL = process.env.SANDBOX_REPO_URL || 'https://gitcode.com/sunzy1940/test';
const TS = new Date().toISOString().replace(/[:.]/g, '').slice(0, 14);
const _evIdx = process.argv.indexOf('--evidence');
const EVIDENCE = (_evIdx >= 0 && process.argv[_evIdx + 1]) || process.env.HDK_EVIDENCE || null;

const results = [];
const log = (assert, pass, detail) => results.push({ assert, pass, detail: String(detail ?? '').slice(0, 400) });

// ---- 定位 MCP server ----
function locateMcpServer() {
  if (process.env.HDK_MCP_SERVER && existsSync(process.env.HDK_MCP_SERVER)) {
    return process.env.HDK_MCP_SERVER;
  }
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const p = join(root, 'huaweicloud-devkit', 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
    if (existsSync(p)) return p;
  } catch {}
  return null;
}

const serverPath = locateMcpServer();
if (!serverPath) {
  log('P0.mcp_server', false, '未找到全局包的 mcp-server.mjs（npm root -g 下无 huaweicloud-devkit）');
  console.log(JSON.stringify({ case: 'sandbox-deploy-monitor', mode: 'blackbox', ts: TS, summary: { total: 1, passed: 0, failed: 1 }, results }, null, 2));
  process.exit(1);
}

// ---- MCP 客户端（Content-Length 帧 + tools/call）----
function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, arguments_) {
    return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } });
  }
  return { child, send, call, id: () => _id++, kill: () => child.kill() };
}

const srv = makeServer(serverPath);

// 发 tools/call，把 MCP content[0].text 解析成业务对象返回 {r} 或 {err}
async function mcpCall(name, args) {
  try {
    const resp = await srv.call(name, args);
    if (resp?.error) return { err: `MCP ${resp.error.code} ${resp.error.message}`.slice(0, 300) };
    const text = resp?.result?.content?.[0]?.text || '';
    if (!text) return { err: 'empty content (工具无返回)' };
    try { return { r: JSON.parse(text) }; }
    catch { return { r: { _raw: text.slice(0, 300) } }; }
  } catch (e) {
    return { err: String(e.message || e).slice(0, 300) };
  }
}

let serverVersion = null;
let workspaceId = null;
let projectDir = null;
let deployedPort = null;

// ---- P0 + P1：initialize / tools/list ----
try {
  const init = await srv.send({ jsonrpc: '2.0', id: srv.id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'sandbox-monitor', version: '1' } } });
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  serverVersion = init?.result?.serverInfo?.version || null;
  const isDevkit = init?.result?.serverInfo?.name === 'huaweicloud-devkit';
  log('P0.mcp_server', !!init?.result && isDevkit, `server=${init?.result?.serverInfo?.name} version=${serverVersion}`);
} catch (e) {
  log('P0.mcp_server', false, String(e.message || e).slice(0, 200));
}

try {
  const tl = await srv.send({ jsonrpc: '2.0', id: srv.id(), method: 'tools/list', params: {} });
  const tools = tl?.result?.tools || [];
  const sbTools = tools.filter((t) => (t.name || '').startsWith('huaweicloud_sandbox_')).map((t) => t.name);
  const need = ['huaweicloud_sandbox_check_user', 'huaweicloud_sandbox_connect', 'huaweicloud_sandbox_upload_project',
    'huaweicloud_sandbox_deploy_nginx', 'huaweicloud_sandbox_deploy_check', 'huaweicloud_sandbox_exec_one_shot',
    'huaweicloud_sandbox_close_session'];
  const missing = need.filter((n) => !sbTools.includes(n));
  log('P1.tools_list', sbTools.length >= 7 && missing.length === 0, `沙箱工具 ${sbTools.length} 个，缺:${missing.join(',') || '无'}`);
} catch (e) {
  log('P1.tools_list', false, String(e.message || e).slice(0, 200));
}

// ---- C1 check_user ----
const cu = await mcpCall('huaweicloud_sandbox_check_user', {});
if (cu.err) log('C1.check_user', false, cu.err);
else log('C1.check_user', cu.r?.realnameVerified === true && cu.r?.agreementSigned === true, JSON.stringify(cu.r));

// ---- C2 connect ----
const conn = await mcpCall('huaweicloud_sandbox_connect', { source: 'CLI' });
if (conn.err) log('C2.connect', false, conn.err);
else {
  const c = conn.r || {};
  workspaceId = c.devStageId || c.sessionId || c.dev_stage_id || c.session_id || null;
  log('C2.connect', c.status === 'connected' && !!workspaceId, `status=${c.status} ws=${(workspaceId || '').slice(0, 12)}`);
}

// ---- D1 clone 静态站 ----
const base = join(tmpdir(), `sandbox-monitor-${Date.now()}`);
projectDir = join(base, 'test');
try {
  mkdirSync(base, { recursive: true });
  execFileSync('git', ['clone', '--depth', '1', REPO_URL, projectDir], { encoding: 'utf8', timeout: 120000, stdio: 'pipe' });
  log('D1.clone', true, REPO_URL);
} catch (e) {
  try {
    execFileSync('git', ['-c', 'http.sslVerify=false', 'clone', '--depth', '1', REPO_URL, projectDir], { encoding: 'utf8', timeout: 120000, stdio: 'pipe' });
    log('D1.clone', true, REPO_URL + ' (sslVerify=false)');
  } catch (e2) {
    log('D1.clone', false, String(e2.message || e2).slice(0, 200));
  }
}

// ---- C3 exec round-trip ----
if (workspaceId) {
  const ex = await mcpCall('huaweicloud_sandbox_exec_one_shot', { workspace_id: workspaceId, command: 'echo hdk-sandbox-monitor-ok' });
  const ok = !ex.err && ex.r && /hdk-sandbox-monitor-ok/.test(String(ex.r.stdout || ''));
  log('C3.exec_roundtrip', ok, ok ? 'stdout 回显正常' : (ex.err || JSON.stringify(ex.r || {}).slice(0, 200)));
} else {
  log('C3.exec_roundtrip', false, '无 workspaceId，跳过');
}

// ---- D2 upload_project ----
if (workspaceId && projectDir) {
  const up = await mcpCall('huaweicloud_sandbox_upload_project', { local_dir: projectDir, remote_dir: '/workspace', workspace_id: workspaceId });
  if (up.err) log('D2.upload_project', false, up.err);
  else {
    const r = up.r || {};
    log('D2.upload_project', r.ok === true && r.md5Verified === true, `md5=${r.md5} verified=${r.md5Verified}`);
  }
} else {
  log('D2.upload_project', false, '前置失败（无 workspaceId / 未 clone）');
}

// ---- D3 deploy_nginx ----
if (workspaceId) {
  const dn = await mcpCall('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'test', output_dir: '.', workspace_id: workspaceId });
  if (dn.err) log('D3.deploy_nginx', false, dn.err);
  else {
    const r = dn.r || {};
    deployedPort = r.port || 8080;
    log('D3.deploy_nginx', r.ok === true, `nginxType=${r.nginxType} port=${deployedPort} exitCode=${r.exitCode}`);
  }
} else {
  log('D3.deploy_nginx', false, '前置失败（无 workspaceId）');
}

// ---- D4 nginx serving ----
if (workspaceId) {
  const dc = await mcpCall('huaweicloud_sandbox_deploy_check', { port: deployedPort || 8080, project: 'test', output_dir: '.', framework_type: 'static', workspace_id: workspaceId });
  let nginxServing = false;
  let w1 = null;
  if (!dc.err && dc.r) {
    const r = dc.r;
    nginxServing = !!(r.checks && r.checks.nginx_serving && r.checks.nginx_serving.status === 'PASS');
    const pu = r.publicUrl || '';
    if (/cn-north-4-bridge\.myhuaweicloud\.com/.test(pu)) w1 = 'legacy-domain:' + pu;
  }
  const cv = await mcpCall('huaweicloud_sandbox_exec_one_shot', {
    workspace_id: workspaceId,
    command: `curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:${deployedPort || 8080}/ 2>/dev/null || echo 000`,
  });
  const rawStdout = (cv.r && String(cv.r.stdout || '')) || '';
  const stripped = rawStdout
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, '')
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
  const httpCode = (stripped.match(/\d{3}/) || ['000'])[0];
  const curlOk = httpCode.startsWith('2') || httpCode.startsWith('3');
  log('D4.nginx_serving', nginxServing && curlOk, `deploy_check=${nginxServing ? 'PASS' : 'FAIL'} curl_http=${httpCode}`);
  if (w1) log('W1.publicUrl_domain', false, w1);
} else {
  log('D4.nginx_serving', false, '前置失败（无 workspaceId）');
}

// ---- 关闭会话 ----
if (workspaceId) {
  const cl = await mcpCall('huaweicloud_sandbox_close_session', { workspace_id: workspaceId });
  log('CLOSE.session', !cl.err, cl.err || 'ok');
}

// ---- 清理 ----
try { if (base) rmSync(base, { recursive: true, force: true }); } catch {}
try { srv.kill(); } catch {}

const requiredAsserts = results.filter((x) => /^(C|D|P)\d?\./.test(x.assert));
const passed = requiredAsserts.filter((x) => x.pass).length;
const failed = requiredAsserts.length - passed;
const out = {
  case: 'sandbox-deploy-monitor',
  mode: 'blackbox',                       // 装真实包 + MCP 会话调用，非源码直调
  target: 'huaweicloud-devkit',
  version: serverVersion,                 // 被测版本（initialize.serverInfo.version）
  repoUrl: REPO_URL,
  region: REGION,
  ts: TS,
  workspaceId: workspaceId ? workspaceId.slice(0, 12) : null,
  summary: { total: requiredAsserts.length, passed, failed },
  results,
};

const json = JSON.stringify(out, null, 2);
console.log(json);

if (EVIDENCE) {
  mkdirSync(EVIDENCE, { recursive: true });
  writeFileSync(join(EVIDENCE, 'result.json'), json, 'utf8');
  writeFileSync(join(EVIDENCE, 'run.stdout'), json, 'utf8');
}

process.exit(failed > 0 ? 1 : 0);