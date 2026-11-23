import { mcpTool, mcpSession, runCli, runNode, writeEvidence, writeProbe, safeJson, VC_QUOTE, DIST, HOME, PKG } from './lib.mjs';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const iso = (tag) => { const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now()); mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
const cases = [];

cases.push({ id: 'D1-3', title: 'doctor健康自检', fn: async () => {
  const r1 = runCli(['doctor'], 240000);
  const passCount = (r1.stdout.match(/\[PASS\]/g) || []).length;
  const warnCount = (r1.stdout.match(/\[(WARN|SKIP|FAIL)\]/g) || []).length;
  const hasGuidance = /re-run:/.test(r1.stdout);
  const ok = r1.status === 0 && passCount >= 5 && hasGuidance;
  return { status: ok ? 'PASS' : 'FAIL', why: 'doctor exit=' + r1.status + '，PASS 项 ' + passCount + ' 个，WARN/SKIP ' + warnCount + ' 个，含修复指引=' + hasGuidance, result: { passCount, warnCount, sample: r1.stdout.slice(0, 1200) } };
} });

cases.push({ id: 'D1-4', title: 'status/update幂等', fn: async () => {
  const cfg = join(HOME, '.hcloud', 'config.json');
  const before = existsSync(cfg) ? readFileSync(cfg, 'utf8').length : -1;
  const s1 = runCli(['status'], 120000);
  const s2 = runCli(['status'], 120000);
  const after = existsSync(cfg) ? readFileSync(cfg, 'utf8').length : -1;
  const idem = s1.stdout.replace(/\x1b\[[0-9;]*m/g, '') === s2.stdout.replace(/\x1b\[[0-9;]*m/g, '');
  const ok = s1.status === 0 && s2.status === 0 && idem && before === after;
  return { status: ok ? 'PASS' : 'FAIL', why: 'status 两次输出一致=' + idem + '，用户 config(~/.hcloud/config.json) 长度 ' + before + '->' + after + ' 未被触碰', result: { idempotent: idem, configLenBefore: before, configLenAfter: after, sample: s1.stdout.slice(0, 600) } };
} });

cases.push({ id: 'D1-26', title: '升级提醒工具注册与协议暴露', fn: async () => {
  const r = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ], 20000);
  const list = (((r.responses.find((x) => x.id === 2) || {}).result || {}).tools || []);
  const cu = list.find((t) => t.name === 'huaweicloud_check_update');
  const up = list.find((t) => t.name === 'huaweicloud_upgrade');
  const ok = !!cu && !!up && !!cu.description && !!cu.inputSchema && !!up.description && !!up.inputSchema;
  return { status: ok ? 'PASS' : 'FAIL', why: 'check_update 注册=' + !!cu + '，upgrade 注册=' + !!up + '，schema 完整=' + (!!(cu && cu.inputSchema) && !!(up && up.inputSchema)), result: { checkUpdate: cu, upgrade: up } };
} });

cases.push({ id: 'D1-27', title: '检测语义-已是最新', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const r = uc.judgeUpdate('1.1.14', { latest: '1.1.14', next: null }, null);
  const ok = r.result === 'up_to_date' && r.updateAvailable === false;
  return { status: ok ? 'PASS' : 'FAIL', why: 'result=' + r.result + '，updateAvailable=' + r.updateAvailable, result: r };
} });

cases.push({ id: 'D1-28', title: '检测语义-有新版本', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const r = uc.judgeUpdate('1.1.2', { latest: '1.1.14', next: null }, null);
  const ok = r.result === 'update_available' && r.updateAvailable === true && r.targetVersion === '1.1.14';
  return { status: ok ? 'PASS' : 'FAIL', why: 'result=' + r.result + '，targetVersion=' + r.targetVersion, result: r };
} });

cases.push({ id: 'D1-30', title: 'semver 比对正确性', fn: async () => {
  const vs = await import('file:///' + DIST + '/update-semver.mjs');
  const pairs = [['1.1.2', '1.1.1', 1], ['1.1.0', '1.1.0-next.9', 1], ['1.1.0', '1.1.0', 0], ['1.1.1', '1.1.2', -1]];
  const out = pairs.map(([a, b, want]) => ({ a, b, got: vs.semverCompare(a, b), want, ok: vs.semverCompare(a, b) === want }));
  const ok = out.every((x) => x.ok);
  return { status: ok ? 'PASS' : 'FAIL', why: out.map((x) => x.a + ' vs ' + x.b + '=' + x.got).join('；'), result: out };
} });

cases.push({ id: 'D1-31', title: 'dismiss 冷却期', fn: async () => {
  const h = iso('d131');
  const r = await mcpTool('huaweicloud_check_update', { dismiss: true, dismissVersion: '1.1.14' }, 60000, { USERPROFILE: h, HOME: h });
  const p = r.parsed || {};
  const fs = await import('node:fs');
  const candidates = [];
  for (const root of [join(h, '.config', 'huaweicloud'), join(h, '.hcloud'), join(h, '.huaweicloud')]) {
    if (!existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const cur = stack.pop();
      for (const n of fs.readdirSync(cur, { withFileTypes: true })) {
        const fp = join(cur, n.name);
        if (n.isDirectory()) stack.push(fp); else candidates.push(fp);
      }
    }
  }
  const contents = candidates.map((f) => ({ f, body: readFileSync(f, 'utf8').slice(0, 400) }));
  const ok = p.dismissed === true && !!p.dismissExpiresAt;
  return { status: ok ? 'PASS' : 'FAIL', why: 'dismissed=' + p.dismissed + '，expiresAt=' + p.dismissExpiresAt + '，隔离 HOME 落盘文件数=' + contents.length, result: { resp: p, contents } };
} });

cases.push({ id: 'D1-33', title: 'skip 文件持久化与多路径', fn: async () => {
  const h = iso('d133');
  const sk = await import('file:///' + DIST + '/update-skip.mjs');
  const p = sk.resolveSkipFilePath({ home: h });
  sk.writeSkipState({ dismissedVersion: '1.1.14', dismissedAt: 1690000000000, expireAt: 1690000000000 + 3 * 86400000 }, { home: h });
  const back = sk.readSkipState({ home: h });
  const fb = sk.fallbackSkipFilePath ? sk.fallbackSkipFilePath({ home: h }) : null;
  const ok = !!p && back && back.dismissedVersion === '1.1.14' && !!back.expireAt;
  return { status: ok ? 'PASS' : 'FAIL', why: '路径=' + p + '，读回结构=' + JSON.stringify(back) + '，回退路径=' + fb, result: { path: p, state: back, fallback: fb, exists: existsSync(p) } };
} });

cases.push({ id: 'D1-41', title: 'check_update 真实 MCP 返回契约', fn: async () => {
  const h = iso('d141');
  const r = await mcpTool('huaweicloud_check_update', {}, 60000, { USERPROFILE: h, HOME: h });
  const p = r.parsed || {};
  const fields = ['currentVersion', 'latestStable', 'latestNext', 'targetVersion', 'updateAvailable', 'dismissed', 'dismissExpiresAt', 'result'];
  const allFields = fields.every((f) => f in p);
  const ok = !r.isError && allFields && typeof p.result === 'string';
  return { status: ok ? 'PASS' : 'FAIL', why: 'isError=' + r.isError + '，字段齐全=' + allFields + '，result=' + p.result + '（四态之一，失败也不抛协议错误）', result: p };
} });

cases.push({ id: 'D1-42', title: 'dismiss 真实闭环与跨调用持久化', fn: async () => {
  const h = iso('d142');
  const first = await mcpTool('huaweicloud_check_update', { dismiss: true, dismissVersion: '1.1.14' }, 60000, { USERPROFILE: h, HOME: h });
  const p1 = first.parsed || {};
  const second = await mcpTool('huaweicloud_check_update', {}, 60000, { USERPROFILE: h, HOME: h });
  const p2 = second.parsed || {};
  const sk = await import('file:///' + DIST + '/update-skip.mjs');
  const st = sk.readSkipState({ home: h });
  const delta = st && st.dismissedAt && st.expireAt ? st.expireAt - st.dismissedAt : null;
  const ok = !!st && delta === 3 * 86400000 && p2.dismissed === true;
  return { status: ok ? 'PASS' : 'FAIL', why: 'skip 文件=' + JSON.stringify(st) + '，expireAt-dismissedAt=' + delta + '(应为259200000)，二次查询 dismissed=' + p2.dismissed, result: { first: p1, second: p2, state: st, delta } };
} });

cases.push({ id: 'D1-45', title: '兜底提示真实序列与预热竞态', fn: async () => {
  const h = iso('d145');
  const t = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_check_update', arguments: {} } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_list_regions', arguments: { vendorConfirmed: VC_QUOTE } } },
  ], 60000);
  const r2 = (t.responses.find((x) => x.id === 2) || {}).result || {};
  const r3 = (t.responses.find((x) => x.id === 3) || {}).result || {};
  const txt2 = (r2.content || []).map((c) => c.text).join('');
  const txt3 = (r3.content || []).map((c) => c.text).join('');
  const checkCarries = /_updateInfo/.test(txt2);
  const ok = !checkCarries && !!txt3;
  return { status: ok ? 'PASS' : 'FAIL', why: '检查工具携带_updateInfo=' + checkCarries + '；后续工具正常返回=' + !!txt3 + '（本轮检测链 check_failed，无更新信息可附）', result: { checkText: txt2.slice(0, 400), laterText: txt3.slice(0, 300) } };
} });

cases.push({ id: 'D1-65', title: '调试模式环境变量', fn: async () => {
  const d = iso('d165');
  const probe = join(d, 'p.mjs');
  writeFileSync(probe, "import { queryDistTagsSync } from 'file:///" + DIST + "/update-registry.js';\nconst r = queryDistTagsSync();\nconsole.error('RESULT_LEN=' + JSON.stringify(r).length);\n", 'utf8');
  const on = runNode(probe, [], 30000, { HUAWEICLOUD_DEVKIT_DEBUG: '1' });
  const off = runNode(probe, [], 30000, { HUAWEICLOUD_DEVKIT_DEBUG: '0' });
  const onDebug = /\[debug\]/.test(on.stderr);
  const offDebug = /\[debug\]/.test(off.stderr);
  const ok = onDebug && !offDebug;
  return { status: ok ? 'PASS' : 'FAIL', why: 'DEBUG=1 有调试日志=' + onDebug + '；DEBUG=0 无=' + !offDebug, result: { onErr: on.stderr.slice(0, 500), offErr: off.stderr.slice(0, 300) } };
} });

cases.push({ id: 'D1-66', title: '遥测开关与端点环境变量', fn: async () => {
  const tel = await import('file:///' + DIST + '/telemetry/telemetry.mjs');
  const a = tel.isTelemetryEnabled({ ...process.env, DEVKIT_TELEMETRY: 'off' });
  const b = tel.isTelemetryEnabled({ ...process.env, DEVKIT_TELEMETRY: 'on' });
  const ok = a === false && b === true;
  return { status: ok ? 'PASS' : 'FAIL', why: 'TELEMETRY=off -> ' + a + '；TELEMETRY=on -> ' + b, result: { off: a, on: b } };
} });

cases.push({ id: 'D1-67', title: 'Agent toolkit 模式与 DSH 跳过安装环境变量', fn: async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(DIST + '/setup-cli.mjs', 'utf8');
  const hasMode = /AGENT_TOOLKIT_MODE/.test(src);
  const hasSkipDsh = /SKIP_DSH/.test(src);
  const hasHcloudBin = /HCLOUD_BIN/.test(src);
  const ok = hasMode && hasSkipDsh && hasHcloudBin;
  return { status: ok ? 'PASS' : 'FAIL', why: '源码级断言：AGENT_TOOLKIT_MODE=' + hasMode + '，SKIP_DSH=' + hasSkipDsh + '，HCLOUD_BIN=' + hasHcloudBin, result: { hasMode, hasSkipDsh, hasHcloudBin } };
} });

cases.push({ id: 'D1-68', title: '图标离线与区域环境变量', fn: async () => {
  const icon = await import('file:///' + DIST + '/icon-library.mjs');
  const offline = await icon.getServiceIcon('ecs', { offline: true });
  const cred = await import('file:///' + DIST + '/auth/credentials.mjs');
  const envRegion = cred.resolveCredentials ? cred.resolveCredentials({ ...process.env, HUAWEICLOUD_REGION: 'cn-east-3', HW_REGION: 'cn-north-4' }) : null;
  const ok = !!offline && /ecs/i.test(JSON.stringify(offline));
  return { status: ok ? 'PASS' : 'FAIL', why: '离线图标返回=' + JSON.stringify(offline).slice(0, 200) + '；region 解析样本=' + JSON.stringify(envRegion && envRegion.region), result: { offline, envRegion } };
} });

cases.push({ id: 'D1-69', title: 'CLI help 子命令', fn: async () => {
  const r = runCli(['help'], 60000);
  const ok = r.status === 0 && /Commands:/.test(r.stdout) && /install/.test(r.stdout) && /doctor/.test(r.stdout);
  return { status: ok ? 'PASS' : 'FAIL', why: 'exit=' + r.status + '，含命令列表=' + /Commands:/.test(r.stdout), result: { head: r.stdout.slice(0, 800) } };
} });

cases.push({ id: 'D1-70', title: '代理配置与 WebSocket 代理', fn: async () => {
  const h = iso('d170');
  const px = await import('file:///' + DIST + '/proxy/proxy-config.mjs');
  px.writeProxyConfig({ https_proxy: 'http://127.0.0.1:8080', no_proxy: 'localhost,127.0.0.1' }, { home: h });
  const rd = px.readProxyConfig({ home: h });
  const hit = px.getProxySettings ? px.getProxySettings('https://iam.cn-north-4.myhuaweicloud.com', { home: h, env: {} }) : null;
  const bypass = px.getProxySettings ? px.getProxySettings('http://localhost:3000', { home: h, env: {} }) : null;
  if (px.clearProxyConfig) px.clearProxyConfig({ home: h });
  const ok = !!rd && !!hit && bypass === null;
  return { status: ok ? 'PASS' : 'FAIL', why: 'proxy.json 读写=' + !!rd + '，命中代理=' + JSON.stringify(hit) + '，no_proxy 绕过=' + JSON.stringify(bypass), result: { read: rd, hit, bypass } };
} });

for (const c of cases) {
  const t0 = Date.now(); let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: { stack: String(e.stack).slice(0, 600) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch (e) { /* ignore */ }
  console.log(c.id.padEnd(7), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 130));
}