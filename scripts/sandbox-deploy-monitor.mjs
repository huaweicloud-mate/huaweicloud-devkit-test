#!/usr/bin/env node
// 沙箱连通性 + 部署能力专项监控探针（确定性，无 LLM 扩展分析）。
//
// 场景：部署 https://gitcode.com/sunzy1940/test 静态网站到华为云沙箱（DevStation），
//       验证「连通性」与「部署能力」两条链路是否健康。
//
// 用法（在测试仓库根目录，已 export node PATH 后）：
//   node scripts/sandbox-deploy-monitor.mjs [--evidence <落盘目录>]
//
// 连通性断言：
//   C1  check_user          实名认证 + 协议签署通过（连接前置）
//   C2  connect             连接沙箱成功，拿到 workspaceId
//   C3  exec round-trip     沙箱内能执行命令并回显（终端链路通）
//
// 部署能力断言：
//   D1  clone 静态站        git clone gitcode.com/sunzy1940/test 成功
//   D2  upload_project      项目上传成功且 md5 校验通过
//   D3  deploy_nginx        静态站 nginx 配置部署成功，返回端口
//   D4  nginx serving       deploy_check 判定 nginx 正在 serve，且本机 curl 端口返回 2xx/3xx
//
// 观察告警（记录但不计 FAIL，供维护者判断是否上报）：
//   W1  publicUrl 域名      deploy_check 返回的 publicUrl 若落在废弃域名
//                            cn-north-4-bridge.myhuaweicloud.com（已迁移），标记 legacy-domain
//
// 退出码：0 = 全部断言通过；1 = 存在 FAIL（脚本错误/异常也归为此类）。
//
// 依赖：源码仓库 hdk（plugins/huaweicloud-core/src/tools.mjs），
//      路径取环境变量 HDK_SRC，否则默认 process.cwd()/../hdk/plugins/huaweicloud-core/src。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const REPO_URL = process.env.SANDBOX_REPO_URL || 'https://gitcode.com/sunzy1940/test';
const TS = new Date().toISOString().replace(/[:.]/g, '').slice(0, 14); // 14 位 YYYYMMDDHHmmss
const EVIDENCE = process.env.HDK_EVIDENCE || null;

const hdkSrc = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const { callTool } = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);

const results = [];
const log = (assert, pass, detail) => results.push({ assert, pass, detail: String(detail ?? '').slice(0, 400) });
const call = async (name, args) => { try { return { r: await callTool(name, args) }; } catch (e) { return { err: String(e.message || e).slice(0, 300) }; } };

let workspaceId = null;
let projectDir = null;
let deployedPort = null;

// ---- C1 check_user ----
const cu = await call('huaweicloud_sandbox_check_user', {});
if (cu.err || !cu.r) {
  log('C1.check_user', false, cu.err || 'no result');
} else {
  const ok = cu.r.realnameVerified === true && cu.r.agreementSigned === true;
  log('C1.check_user', ok, JSON.stringify(cu.r));
}

// ---- C2 connect ----
const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
if (conn.err) {
  log('C2.connect', false, conn.err);
} else {
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
  // GitCode 偶发 SSL 证书错误，单次关闭证书校验重试
  try {
    execFileSync('git', ['-c', 'http.sslVerify=false', 'clone', '--depth', '1', REPO_URL, projectDir], { encoding: 'utf8', timeout: 120000, stdio: 'pipe' });
    log('D1.clone', true, REPO_URL + ' (sslVerify=false)');
  } catch (e2) {
    log('D1.clone', false, String(e2.message || e2).slice(0, 200));
  }
}

// ---- C3 exec round-trip（连通性，不依赖部署）----
if (workspaceId) {
  const ex = await call('huaweicloud_sandbox_exec_one_shot', { workspace_id: workspaceId, command: 'echo hdk-sandbox-monitor-ok' });
  const ok = !ex.err && ex.r && /hdk-sandbox-monitor-ok/.test(String(ex.r.stdout || ''));
  log('C3.exec_roundtrip', ok, ok ? 'stdout 回显正常' : (ex.err || JSON.stringify(ex.r || {}).slice(0, 200)));
} else {
  log('C3.exec_roundtrip', false, '无 workspaceId，跳过');
}

// ---- D2 upload_project ----
if (workspaceId && projectDir) {
  const up = await call('huaweicloud_sandbox_upload_project', { local_dir: projectDir, remote_dir: '/workspace', workspace_id: workspaceId });
  if (up.err) {
    log('D2.upload_project', false, up.err);
  } else {
    const r = up.r || {};
    log('D2.upload_project', r.ok === true && r.md5Verified === true, `md5=${r.md5} verified=${r.md5Verified}`);
  }
} else {
  log('D2.upload_project', false, '前置失败（无 workspaceId / 未 clone）');
}

// ---- D3 deploy_nginx ----
if (workspaceId) {
  const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'test', output_dir: '.', workspace_id: workspaceId });
  if (dn.err) {
    log('D3.deploy_nginx', false, dn.err);
  } else {
    const r = dn.r || {};
    deployedPort = r.port || 8080;
    log('D3.deploy_nginx', r.ok === true, `nginxType=${r.nginxType} port=${deployedPort} exitCode=${r.exitCode}`);
  }
} else {
  log('D3.deploy_nginx', false, '前置失败（无 workspaceId）');
}

// ---- D4 nginx serving（deploy_check + curl 实测）----
if (workspaceId) {
  const dc = await call('huaweicloud_sandbox_deploy_check', { port: deployedPort || 8080, project: 'test', output_dir: '.', framework_type: 'static', workspace_id: workspaceId });
  let nginxServing = false;
  let w1 = null;
  if (!dc.err && dc.r) {
    const r = dc.r;
    nginxServing = r.checks && r.checks.nginx_serving && r.checks.nginx_serving.status === 'PASS';
    const pu = r.publicUrl || '';
    if (/cn-north-4-bridge\.myhuaweicloud\.com/.test(pu)) w1 = 'legacy-domain:' + pu;
  }
  // 沙箱内 curl 实测（独立交叉验证；先剥终端 OSC/CSI 转义序列再取 http code，
  // 否则 \x1b]133;C\x07 里的数字会污染结果，误判 curlOk=false）
  const cv = await call('huaweicloud_sandbox_exec_one_shot', {
    workspace_id: workspaceId,
    command: `curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:${deployedPort || 8080}/ 2>/dev/null || echo 000`,
  });
  const rawStdout = (cv.r && String(cv.r.stdout || '')) || '';
  const stripped = rawStdout
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, '')   // OSC 序列 \x1b]...\x07
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');           // CSI 序列 \x1b[...X
  const httpCode = (stripped.match(/\d{3}/) || ['000'])[0];
  const curlOk = httpCode.startsWith('2') || httpCode.startsWith('3');
  log('D4.nginx_serving', nginxServing && curlOk, `deploy_check=${nginxServing ? 'PASS' : 'FAIL'} curl_http=${httpCode}`);
  if (w1) log('W1.publicUrl_domain', false, w1);
} else {
  log('D4.nginx_serving', false, '前置失败（无 workspaceId）');
}

// ---- 关闭会话 ----
if (workspaceId) {
  const cl = await call('huaweicloud_sandbox_close_session', { workspace_id: workspaceId });
  log('CLOSE.session', !cl.err, cl.err || 'ok');
}

// ---- 本地临时目录清理 ----
try { if (base) rmSync(base, { recursive: true, force: true }); } catch {}

const passed = results.filter((x) => x.assert.startsWith('C') || x.assert.startsWith('D')).filter((x) => x.pass).length;
const required = results.filter((x) => (x.assert.startsWith('C') || x.assert.startsWith('D'))).length;
const failed = required - passed;
const out = {
  case: 'sandbox-deploy-monitor',
  repoUrl: REPO_URL,
  region: REGION,
  ts: TS,
  workspaceId: workspaceId ? workspaceId.slice(0, 12) : null,
  summary: { total: required, passed, failed },
  results,
};

const json = JSON.stringify(out, null, 2);
console.log(json);

if (EVIDENCE) {
  mkdirSync(EVIDENCE, { recursive: true });
  writeFileSync(join(EVIDENCE, 'result.json'), json, 'utf8');
  writeFileSync(join(EVIDENCE, 'stdout.log'), json, 'utf8');
}

process.exit(failed > 0 ? 1 : 0);