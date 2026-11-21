import { mcpTool, runNode, writeEvidence, writeProbe, safeJson, VC_QUOTE, DIST, HOME } from './lib.mjs';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const iso = (tag) => { const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now()); mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
const cases = [];

cases.push({ id: 'D1-33', title: 'skip 文件持久化与多路径', fn: async () => {
  const sk = await import('file:///' + DIST + '/update-skip.mjs');
  const p = sk.resolveSkipFilePath();
  sk.writeSkipState(p, '1.1.14', { at: 1690000000000, days: 3 });
  const back = sk.readSkipState(p);
  const fb = sk.fallbackSkipFilePath();
  const ok = !!p && !!back && back.dismissedVersion === '1.1.14' && !!back.expireAt && /T/.test(back.expireAt);
  return { status: ok ? 'PASS' : 'FAIL', why: '主路径=' + p + '，回退路径=' + fb + '，读回=' + JSON.stringify(back), result: { path: p, fallback: fb, state: back, exists: existsSync(p), raw: existsSync(p) ? readFileSync(p, 'utf8') : null } };
} });

cases.push({ id: 'D1-65', title: '调试模式环境变量', fn: async () => {
  const d = iso('d165');
  const probe = join(d, 'p.mjs');
  writeFileSync(probe, "import { queryDistTagsFetch } from 'file:///" + DIST + "/update-registry.js';\nconst r = await queryDistTagsFetch({ timeoutMs: 3000 });\nconsole.error('RESULT=' + JSON.stringify(r));\n", 'utf8');
  const bad = { HUAWEICLOUD_NPM_REGISTRY: 'http://127.0.0.1:1/', HUAWEICLOUD_DEVKIT_DEBUG: '1' };
  const on = runNode(probe, [], 30000, bad);
  const off = runNode(probe, [], 30000, { ...bad, HUAWEICLOUD_DEVKIT_DEBUG: '0' });
  const onDebug = /\[debug\]/.test(on.stderr);
  const offDebug = /\[debug\]/.test(off.stderr);
  const ok = onDebug && !offDebug;
  return { status: ok ? 'PASS' : 'FAIL', why: 'DEBUG=1 失败路径打印调试日志=' + onDebug + '；DEBUG=0 不打印=' + !offDebug, result: { onErr: on.stderr.slice(0, 600), offErr: off.stderr.slice(0, 300) } };
} });

cases.push({ id: 'D1-66', title: '遥测开关与端点环境变量', fn: async () => {
  const tel = await import('file:///' + DIST + '/telemetry/telemetry.mjs');
  const old = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const a = tel.isTelemetryEnabled();
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
  const b = tel.isTelemetryEnabled();
  delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  const c = tel.isTelemetryEnabled();
  if (old !== undefined) process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = old;
  const src = readFileSync(DIST + '/telemetry/event-pipeline.mjs', 'utf8');
  const endpointEnv = /HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT/.test(src);
  const ok = a === false && b === true && c === true && endpointEnv;
  return { status: ok ? 'PASS' : 'FAIL', why: 'TELEMETRY=off -> ' + a + '，=on -> ' + b + '，未设 -> ' + c + '；端点环境变量读取=' + endpointEnv, result: { off: a, on: b, unset: c, endpointEnv } };
} });

cases.push({ id: 'D1-67', title: 'Agent toolkit 模式与 DSH 跳过安装环境变量', fn: async () => {
  const merge = readFileSync(DIST + '/mcp-config-merge.mjs', 'utf8');
  const io = readFileSync(DIST + '/mcp-config-io.mjs', 'utf8');
  const up = readFileSync(DIST + '/update-upgrade.mjs', 'utf8');
  const modeInjected = /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(io);
  const requiredHasBin = /REQUIRED_ENV_KEYS\s*=\s*new Set\(\[[^\]]*HUAWEICLOUD_AGENT_TOOLKIT_MODE[^\]]*HCLOUD_BIN/.test(merge);
  const skipDsh = /HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL/.test(up);
  const ok = modeInjected && requiredHasBin && skipDsh;
  return { status: ok ? 'PASS' : 'FAIL', why: '注入 AGENT_TOOLKIT_MODE=' + modeInjected + '，REQUIRED_ENV_KEYS 含 MODE+HCLOUD_BIN=' + requiredHasBin + '，SKIP_DSH 开关=' + skipDsh, result: { modeInjected, requiredHasBin, skipDsh } };
} });

cases.push({ id: 'D1-68', title: '图标离线与区域环境变量', fn: async () => {
  const d = iso('d168');
  const probe = join(d, 'p.mjs');
  writeFileSync(probe, "import { getServiceIcon } from 'file:///" + DIST + "/icon-library.js';\nconst r = await getServiceIcon('ecs');\nconsole.log(JSON.stringify({ source: r && r.source, ok: r && r.ok, keys: Object.keys(r || {}) }));\n", 'utf8');
  const off = runNode(probe, [], 30000, { HUAWEICLOUD_ICONS_OFFLINE: '1' });
  const live = runNode(probe, [], 30000, { HUAWEICLOUD_ICONS_OFFLINE: '0' });
  const offJson = safeJson(off.stdout.trim());
  const liveJson = safeJson(live.stdout.trim());
  const cred = await import('file:///' + DIST + '/auth/credentials.mjs');
  const envRegion = cred.resolveCredentials ? cred.resolveCredentials({ ...process.env, HUAWEICLOUD_REGION: 'cn-east-3', HW_REGION: 'cn-north-4' }) : null;
  const ok = !!offJson && offJson.source === 'snapshot';
  return { status: ok ? 'PASS' : 'FAIL', why: 'ICONS_OFFLINE=1 时 source=' + (offJson && offJson.source) + '（应为 snapshot 本地）；默认 source=' + (liveJson && liveJson.source) + '；region 解析=' + JSON.stringify(envRegion && envRegion.region), result: { offline: offJson, live: liveJson, envRegion } };
} });

for (const c of cases) {
  const t0 = Date.now(); let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: { stack: String(e.stack).slice(0, 600) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch (e) { /* ignore */ }
  console.log(c.id.padEnd(7), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 150));
}