import {
  mcpTool, mcpSession, runCli, runNode, writeEvidence, writeProbe, safeJson,
  VC_QUOTE, DIST, HOME, PKG,
} from './lib.mjs';
import { existsSync, readFileSync, mkdirSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const iso = (tag) => {
  const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now());
  mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true });
  return t;
};
const cases = [];

cases.push({ id: 'D1-3', title: 'doctor????', fn: async () => {
  const r1 = runCli(['doctor'], 240000);
  const passCount = (r1.stdout.match(/\[PASS\]/g) || []).length;
  const warnCount = (r1.stdout.match(/\[(WARN|SKIP|FAIL)\]/g) || []).length;
  const hasGuidance = /re-run:/.test(r1.stdout);
  const ok = r1.status === 0 && passCount >= 5 && hasGuidance;
  return { status: ok ? 'PASS' : 'FAIL', why: 'doctor exit=' + r1.status + ' PASS?=' + passCount + ' WARN/SKIP=' + warnCount + ' ?????=' + hasGuidance, result: { passCount, warnCount, sample: r1.stdout.slice(0, 1200) } };
} });

cases.push({ id: 'D1-4', title: 'status/update??', fn: async () => {
  const cfg = join(HOME, '.hcloud', 'config.json');
  const before = existsSync(cfg) ? readFileSync(cfg, 'utf8').length : -1;
  const s1 = runCli(['status'], 120000);
  const s2 = runCli(['status'], 120000);
  const after = existsSync(cfg) ? readFileSync(cfg, 'utf8').length : -1;
  const idem = s1.stdout.replace(/\x1b\[[0-9;]*m/g, '') === s2.stdout.replace(/\x1b\[[0-9;]*m/g, '');
  const ok = s1.status === 0 && s2.status === 0 && idem && before === after;
  return { status: ok ? 'PASS' : 'FAIL', why: 'status????=' + idem + ' ??config(~/.hcloud/config.json)???? ' + before + '->' + after, result: { idempotent: idem, configLenBefore: before, configLenAfter: after, sample: s1.stdout.slice(0, 600) } };
} });

cases.push({ id: 'D1-26', title: '?????????????', fn: async () => {
  const r = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ], 20000);
  const list = (((r.responses.find((x) => x.id === 2) || {}).result || {}).tools || []);
  const cu = list.find((t) => t.name === 'huaweicloud_check_update');
  const up = list.find((t) => t.name === 'huaweicloud_upgrade');
  const ok = !!cu && !!up && !!cu.description && !!cu.inputSchema && !!up.description && !!up.inputSchema;
  return { status: ok ? 'PASS' : 'FAIL', why: 'check_update??=' + !!cu + ' upgrade??=' + !!up + ' schema??=' + (!!(cu && cu.inputSchema) && !!(up && up.inputSchema)), result: { checkUpdate: cu, upgrade: up } };
} });

cases.push({ id: 'D1-27', title: '????-????', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.js');
  const r = uc.judgeUpdate('1.1.14', { latest: '1.1.14', next: null }, null);
  const ok = r.result === 'up_to_date' && r.updateAvailable === false;
  return { status: ok ? 'PASS' : 'FAIL', why: 'result=' + r.result + ' updateAvailable=' + r.updateAvailable, result: r };
} });

cases.push({ id: 'D1-28', title: '????-????', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.js');
  const r = uc.judgeUpdate('1.1.2', { latest: '1.1.14', next: null }, null);
  const ok = r.result === 'update_available' && r.updateAvailable === true && r.targetVersion === '1.1.14';
  return { status: ok ? 'PASS' : 'FAIL', why: 'result=' + r.result + ' targetVersion=' + r.targetVersion, result: r };
} });

cases.push({ id: 'D1-30', title: 'semver ?????', fn: async () => {
  const vs = await import('file:///' + DIST + '/update-semver.js');
  const pairs = [
    ['1.1.2', '1.1.1', 1], ['1.1.0', '1.1.0-next.9', 1], ['1.1.0', '1.1.0', 0], ['1.1.1', '1.1.2', -1],
  ];
  const out = pairs.map(([a, b, want]) => ({ a, b, got: vs.semverCompare(a, b), want, ok: vs.semverCompare(a, b) === want }));
  const ok = out.every((x) => x.ok);
  return { status: ok ? 'PASS' : 'FAIL', why: out.map((x) => x.a + ' vs ' + x.b + '=' + x.got).join('; '), result: out };
} });

cases.push({ id: 'D1-31', title: 'dismiss ???', fn: async () => {
  const h = iso('d131');
  const r = await mcpTool('huaweicloud_check_update', { dismiss: true, dismissVersion: '1.1.14' }, 60000, { USERPROFILE: h, HOME: h });
  const p = r.parsed || {};
  const skipFiles = [];
  const walk = (d) => { if (!existsSync(d)) return; for (const n of readFileSync ? [] : []) { /* unused */ } };
  const candidates = [];
  for (const root of [join(h, '.config', 'huaweicloud'), join(h, '.hcloud'), join(h, '.huaweicloud'), join(h, '.workbuddy')]) {
    if (!existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const cur = stack.pop();
      for (const n of (await import('node:fs')).readdirSync(cur, { withFileTypes: true })) {
        const fp = join(cur, n.name);
        if (n.isDirectory()) stack.push(fp);
        else if (/skip|dismiss/i.test(n.name)) candidates.push(fp);
      }
    }
  }
  const contents = candidates.map((f) => ({ f, body: readFileSync(f, 'utf8').slice(0, 400) }));
  const ok = p.dismissed === true && !!p.dismissExpiresAt;
  return { status: ok ? 'PASS' : 'FAIL', why: 'dismissed=' + p.dismissed + ' expiresAt=' + p.dismissExpiresAt + ' ????=' + contents.map((c) => c.f).join(','), result: { resp: p, contents } };
} });

cases.push({ id: 'D1-33', title: 'skip ?????????', fn: async () => {
  const h = iso('d133');
  const sk = await import('file:///' + DIST + '/update-skip.js');
  const p = sk.resolveSkipFilePath({ home: h });
  sk.writeSkipState({ dismissedVersion: '1.1.14', dismissedAt: 1690000000000, expireAt: 1690000000000 + 3 * 86400000 }, { home: h });
  const back = sk.readSkipState({ home: h });
  const fb = sk.fallbackSkipFilePath ? sk.fallbackSkipFilePath({ home: h }) : null;
  const ok = !!p && back && back.dismissedVersion === '1.1.14' && !!back.expireAt;
  return { status: ok ? 'PASS' : 'FAIL', why: 'path=' + p + ' ??=' + JSON.stringify(back) + ' fallback=' + fb, result: { path: p, state: back, fallback: fb, exists: existsSync(p) } };
} });

cases.push({ id: 'D1-41', title: 'check_update ?? MCP ????', fn: async () => {
  const h = iso('d141');
  const r = await mcpTool('huaweicloud_check_update', {}, 60000, { USERPROFILE: h, HOME: h });
  const p = r.parsed || {};
  const fields = ['currentVersion', 'latestStable', 'latestNext', 'targetVersion', 'updateAvailable', 'dismissed', 'dismissExpiresAt', 'result'];
  const allFields = fields.every((f) => f in p);
  const ok = !r.isError && allFields && typeof p.result === 'string';
  return { status: ok ? 'PASS' : 'FAIL', why: 'isError=' + r.isError + ' ????=' + allFields + ' result=' + p.result + '??????', result: p };
} });

cases.push({ id: 'D1-42', title: 'dismiss ???????????', fn: async () => {
  const h = iso('d142');
  const first = await mcpTool('huaweicloud_check_update', { dismiss: true, dismissVersion: '1.1.14' }, 60000, { USERPROFILE: h, HOME: h });
  const p1 = first.parsed || {};
  const second = await mcpTool('huaweicloud_check_update', {}, 60000, { USERPROFILE: h, HOME: h });
  const p2 = second.parsed || {};
  const sk = await import('file:///' + DIST + '/update-skip.js');
  const st = sk.readSkipState({ home: h });
  const delta = st && st.dismissedAt && st.expireAt ? st.expireAt - st.dismissedAt : null;
  const ok = !!st && delta === 3 * 86400000 && p2.dismissed === true;
  return { status: ok ? 'PASS' : 'FAIL', why: 'skip ????=' + JSON.stringify(st) + ' expireAt-dismissedAt=' + delta + '(??259200000) ????dismissed=' + p2.dismissed, result: { first: p1, second: p2, state: st, delta } };
} });

cases.push({ id: 'D1-45', title: '?????????????', fn: async () => {
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
  return { status: ok ? 'PASS' : 'FAIL', why: '??????_updateInfo=' + checkCarries + '?????????=' + !!txt3 + '?????? check_failed ????????', result: { checkText: txt2.slice(0, 400), laterText: txt3.slice(0, 300) } };
} });

cases.push({ id: 'D1-65', title: '????????', fn: async () => {
  const probe = join(iso('d165'), 'p.mjs');
  writeFileSync(probe, "import { queryDistTagsSync } from 'file:///" + DIST + "/update-registry.js';\nconst r = queryDistTagsSync();\nconsole.error('RESULT_LEN=' + JSON.stringify(r).length);\n", 'utf8');
  const on = runNode(probe, [], 30000, { HUAWEICLOUD_DEVKIT_DEBUG: '1' });
  const off = runNode(probe, [], 30000, { HUAWEICLOUD_DEVKIT_DEBUG: '0' });
  const onDebug = /\[debug\]/.test(on.stderr);
  const offDebug = /\[debug\]/.test(off.stderr);
  const ok = onDebug && !offDebug;
  return { status: ok ? 'PASS' : 'FAIL', why: 'DEBUG=1 ?????=' + onDebug + '?DEBUG=0 ?=' + (!offDebug), result: { onErr: on.stderr.slice(0, 500), offErr: off.stderr.slice(0, 300) } };
} });

cases.push({ id: 'D1-66', title: '???????????', fn: async () => {
  const tel = await import('file:///' + DIST + '/telemetry/telemetry.js');
  const a = tel.isTelemetryEnabled({ ...process.env, DEVKIT_TELEMETRY: 'off' });
  const b = tel.isTelemetryEnabled({ ...process.env, DEVKIT_TELEMETRY: 'on' });
  const ok = a === false && b === true;
  return { status: ok ? 'PASS' : 'FAIL', why: 'TELEMETRY=off -> ' + a + '?=on -> ' + b, result: { off: a, on: b } };
} });

cases.push({ id: 'D1-67', title: 'Agent toolkit ??? DSH ????????', fn: async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(DIST + '/setup-cli.js', 'utf8');
  const hasMode = /AGENT_TOOLKIT_MODE/.test(src);
  const hasSkipDsh = /SKIP_DSH/.test(src);
  const hasHcloudBin = /HCLOUD_BIN/.test(src);
  const ok = hasMode && hasSkipDsh && hasHcloudBin;
  return { status: ok ? 'PASS' : 'FAIL', why: 'AGENT_TOOLKIT_MODE=' + hasMode + ' SKIP_DSH=' + hasSkipDsh + ' HCLOUD_BIN=' + hasHcloudBin + '????????????????', result: { hasMode, hasSkipDsh, hasHcloudBin } };
} });

cases.push({ id: 'D1-68', title: '???????????', fn: async () => {
  const icon = await import('file:///' + DIST + '/icon-library.js');
  const offline = await icon.getServiceIcon('ecs', { offline: true });
  const cred = await import('file:///' + DIST + '/auth/credentials.js');
  const envRegion = cred.resolveCredentials ? cred.resolveCredentials({ ...process.env, HUAWEICLOUD_REGION: 'cn-east-3', HW_REGION: 'cn-north-4' }) : null;
  const ok = !!offline && /ecs/i.test(JSON.stringify(offline));
  return { status: ok ? 'PASS' : 'FAIL', why: '??????=' + JSON.stringify(offline).slice(0, 200) + '?HUAWEICLOUD_REGION ?????=' + JSON.stringify(envRegion && envRegion.region), result: { offline, envRegion } };
} });

cases.push({ id: 'D1-69', title: 'CLI help ???', fn: async () => {
  const r = runCli(['help'], 60000);
  const ok = r.status === 0 && /Commands:/.test(r.stdout) && /install/.test(r.stdout) && /doctor/.test(r.stdout);
  return { status: ok ? 'PASS' : 'FAIL', why: 'exit=' + r.status + ' ?????=' + /Commands:/.test(r.stdout), result: { head: r.stdout.slice(0, 800) } };
} });

cases.push({ id: 'D1-70', title: '????? WebSocket ??', fn: async () => {
  const h = iso('d170');
  const px = await import('file:///' + DIST + '/proxy/proxy-config.js');
  px.writeProxyConfig({ https_proxy: 'http://127.0.0.1:8080', no_proxy: 'localhost,127.0.0.1' }, { home: h });
  const rd = px.readProxyConfig({ home: h });
  const hit = px.getProxySettings ? px.getProxySettings('https://iam.cn-north-4.myhuaweicloud.com', { home: h, env: {} }) : null;
  const bypass = px.getProxySettings ? px.getProxySettings('http://localhost:3000', { home: h, env: {} }) : null;
  px.clearProxyConfig && px.clearProxyConfig({ home: h });
  const ok = !!rd && !!hit && bypass === null;
  return { status: ok ? 'PASS' : 'FAIL', why: 'proxy.json ??=' + !!rd + ' ????=' + JSON.stringify(hit) + ' no_proxy ??=' + JSON.stringify(bypass), result: { read: rd, hit, bypass } };
} });

/* D2 */
cases.push({ id: 'D2-1', title: 'auth init????', fn: async () => {
  const h = iso('d21');
  const r = await mcpTool('huaweicloud_auth_init', { vendorConfirmed: VC_QUOTE, ak: 'AKTESTD210000000000', sk: 'SKTESTD2100000000000000000000000000', region: 'cn-north-4' }, 90000, { USERPROFILE: h, HOME: h });
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  const koo = join(h, '.hcloud', 'config.json');
  const obs = join(h, '.obsutil', 'config');
  const files = { s1: existsSync(s1), koo: existsSync(koo), obs: existsSync(obs) };
  const ok = files.s1;
  return { status: ok ? 'PASS' : 'FAIL', why: '?? HOME ? S1=' + files.s1 + ' KooCLI=' + files.koo + ' OBS=' + files.obs + '???=' + (r.text || '').slice(0, 220), result: { files, resp: r.parsed || r.text } };
} });

cases.push({ id: 'D2-2', title: 'auth status?????', fn: async () => {
  const h = iso('d22');
  const a = await mcpTool('huaweicloud_auth_status', { vendorConfirmed: VC_QUOTE }, 45000, { USERPROFILE: h, HOME: h });
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  writeFileSync(s1, JSON.stringify({ ak: 'AKTESTD220000000000', sk: 'SKTESTD2200000000000000000000000000', region: 'cn-north-4' }), 'utf8');
  const b = await mcpTool('huaweicloud_auth_status', { vendorConfirmed: VC_QUOTE }, 45000, { USERPROFILE: h, HOME: h });
  const p1 = a.parsed || {}, p2 = b.parsed || {};
  const ok = !!(p1 && p2) && JSON.stringify(p1) !== JSON.stringify(p2);
  return { status: ok ? 'PASS' : 'FAIL', why: '??? vs ?S1 ????=' + (JSON.stringify(p1) !== JSON.stringify(p2)), result: { empty: p1, withS1: p2 } };
} });

cases.push({ id: 'D2-5', title: '????????', fn: async () => {
  const h = iso('d25');
  const r = await mcpTool('huaweicloud_auth_status', { vendorConfirmed: VC_QUOTE }, 45000, { USERPROFILE: h, HOME: h });
  const txt = (r.text || '') + JSON.stringify(r.parsed || {});
  const guided = /auth init|configure|??|credential/i.test(txt);
  const ok = guided && !/at Object\.<anonymous>|node:internal/.test(txt);
  return { status: ok ? 'PASS' : 'FAIL', why: '???????????=' + guided + ' ????=' + !/at Object\.<anonymous>/.test(txt), result: { text: txt.slice(0, 600) } };
} });

cases.push({ id: 'D2-10', title: 'R7 current???', fn: async () => {
  const h = iso('d210');
  const dir = join(h, '.hcloud');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'config.json'), JSON.stringify({ current: 'deploy', profiles: [{ name: 'default', mode: 'AKSK' }, { name: 'deploy', mode: 'AKSK' }] }), 'utf8');
  const fx = PKG + '/../..';
  const fixture = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/eval/harness/fixtures/d2-10-koocli-profile.mjs';
  let fixOut = null;
  if (existsSync(fixture)) { const r = runNode(fixture, [DIST, '--evid', join(h, 'ev')], 60000, { USERPROFILE: h, HOME: h }); fixOut = { status: r.status, out: (r.stdout + r.stderr).slice(0, 600) }; }
  const kc = await import('file:///' + DIST + '/auth/koocli.js').catch(() => null);
  return { status: fixOut && fixOut.status === 0 ? 'PASS' : 'BLOCKED', why: fixOut ? '???? exit=' + fixOut.status : '????: ' + fixture, result: { fixtureOut: fixOut, configWritten: true } };
} });

cases.push({ id: 'D2-12', title: 'R10 runtime??????', fn: async () => {
  const h = iso('d212');
  const r1 = await mcpTool('huaweicloud_auth_switch', { vendorConfirmed: VC_QUOTE, mode: 'memory', action: 'temporary', ak: 'AKTESTD21200000000', sk: 'SKTESTD2120000000000000000000000000', region: 'cn-north-4' }, 60000, { USERPROFILE: h, HOME: h });
  const r2 = await mcpTool('huaweicloud_auth_sync', { target: 'all' }, 60000, { USERPROFILE: h, HOME: h });
  const p = r2.parsed || {};
  const txt = (r2.text || '') + JSON.stringify(p);
  const suppressed = /suppress|R10|runtime/i.test(txt);
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  return { status: suppressed && !existsSync(s1) ? 'PASS' : 'FAIL', why: 'auth_sync ??=' + txt.slice(0, 260) + '; S1 ??=' + existsSync(s1), result: { switchResp: r1.parsed || r1.text, syncResp: p, s1Exists: existsSync(s1) } };
} });

cases.push({ id: 'D2-13', title: 'R9 configuredBySession??env', fn: async () => {
  const h = iso('d213');
  const cred = await import('file:///' + DIST + '/auth/credentials.js');
  cred.writeGlobalCredentials({ ak: 'AK_S1_000000000000', sk: 'SK_S1_0000000000000000000000000000', region: 'cn-north-4', configuredBySession: true }, { home: h });
  const withEnv = cred.resolveCredentials ? cred.resolveCredentials({ ...process.env, HW_ACCESS_KEY: 'AK_ENV_0000000000', HW_SECRET_KEY: 'SK_ENV_000000000000000000000000000' }, { home: h }) : null;
  const fixture = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/eval/harness/fixtures/d2-13-s1-env.mjs';
  const fx = existsSync(fixture) ? runNode(fixture, [DIST, '--evid', join(h, 'ev')], 60000, { USERPROFILE: h, HOME: h }) : null;
  const ak = withEnv && (withEnv.ak || withEnv.accessKeyId);
  const ok = ak === 'AK_S1_000000000000';
  return { status: ok || (fx && fx.status === 0) ? 'PASS' : 'FAIL', why: 'S1(configuredBySession) ?? AK=' + ak + '?env=AK_ENV_0000000000', result: { resolved: withEnv, fixture: fx && { status: fx.status, out: (fx.stdout + fx.stderr).slice(0, 500) } } };
} });

cases.push({ id: 'D2-16', title: 'import???????', fn: async () => {
  const h = iso('d216');
  const f = join(h, '.config', 'huaweicloud', 'creds-import.json');
  writeFileSync(f, JSON.stringify({ ak: 'AK_IMPORT_0000000', sk: 'SK_IMPORT_000000000000000000000000000', region: 'cn-north-4' }), 'utf8');
  const r = await mcpTool('huaweicloud_auth_switch', { vendorConfirmed: VC_QUOTE, mode: 'import', action: 'temporary' }, 60000, { USERPROFILE: h, HOME: h });
  return { status: !existsSync(f) ? 'PASS' : 'FAIL', why: 'import ??????=' + !existsSync(f) + '???=' + (r.text || '').slice(0, 220), result: { fileExists: existsSync(f), resp: r.parsed || r.text } };
} });

cases.push({ id: 'D2-26', title: '???????', fn: async () => {
  const h = iso('d226');
  const cred = await import('file:///' + DIST + '/auth/credentials.js');
  cred.writeGlobalCredentials({ ak: 'AK_BK_00000000000000', sk: 'SK_BK_0000000000000000000000000000', region: 'cn-north-4' }, { home: h });
  const bk = cred.backupGlobalCredentials ? cred.backupGlobalCredentials({ home: h }) : null;
  const p = join(h, '.config', 'huaweicloud', 'credentials.json');
  writeFileSync(p, JSON.stringify({ ak: 'BROKEN' }), 'utf8');
  const rs = cred.restoreGlobalCredentialsBackup ? cred.restoreGlobalCredentialsBackup({ home: h }) : null;
  const after = cred.readGlobalCredentials ? cred.readGlobalCredentials({ home: h }) : null;
  const ok = !!after && (after.ak === 'AK_BK_00000000000000' || after.accessKeyId === 'AK_BK_00000000000000');
  return { status: ok ? 'PASS' : 'FAIL', why: '??=' + JSON.stringify(bk).slice(0, 160) + ' ??? AK=' + JSON.stringify(after && (after.ak || after.accessKeyId)), result: { backup: bk, restored: after } };
} });

cases.push({ id: 'D2-27', title: 'KooCLI ????', fn: async () => {
  const kv = await import('file:///' + DIST + '/koocli-version.js');
  const ver = kv.getKooCliVersion();
  const parsed = kv.parseHcloudVersion('hcloud 7.2.12 (windows/amd64)');
  const cmp = kv.compareVersion('7.2.12', '7.2.9');
  const base = kv.kooCliDownloadBase('7.2.12');
  const ok = parsed === '7.2.12' && cmp === 1 && /7\.2\.12|latest/.test(String(base));
  return { status: ok ? 'PASS' : 'FAIL', why: 'getKooCliVersion=' + ver + ' parse=' + parsed + ' compare=' + cmp + ' base=' + base, result: { ver, parsed, cmp, base } };
} });

for (const c of cases) {
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: { stack: String(e.stack).slice(0, 600) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch (e) { /* ignore */ }
  console.log(c.id.padEnd(7), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 130));
}
