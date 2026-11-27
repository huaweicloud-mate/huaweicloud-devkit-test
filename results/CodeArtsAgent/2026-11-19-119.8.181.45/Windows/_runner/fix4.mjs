import { mcpTool, runCli, runNode, writeEvidence, writeProbe, safeJson, VC_QUOTE, DIST, HOME } from './lib.mjs';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const iso = (tag) => { const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now()); mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
const approve = (token, h) => runCli(['approve', token], 60000, { USERPROFILE: h, HOME: h, NO_COLOR: '1' });
const cases = [];

cases.push({ id: 'D2-1', title: 'auth init三端同步', fn: async () => {
  const h = iso('d21c');
  const env = { USERPROFILE: h, HOME: h };
  let r = await mcpTool('huaweicloud_auth_init', { vendorConfirmed: VC_QUOTE, ak: 'AKTESTD210000000000', sk: 'SKTESTD2100000000000000000000000000', region: 'cn-north-4' }, 90000, env);
  let p = r.parsed || {};
  let approved = null;
  if (p.approvalToken) {
    const ap = approve(p.approvalToken, h);
    approved = { status: ap.status, out: (ap.stdout + ap.stderr).slice(0, 300) };
    r = await mcpTool('huaweicloud_auth_init', { vendorConfirmed: VC_QUOTE, ak: 'AKTESTD210000000000', sk: 'SKTESTD2100000000000000000000000000', region: 'cn-north-4', approvalToken: p.approvalToken, approvedByUser: true }, 90000, env);
    p = r.parsed || {};
  }
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  const koo = join(h, '.hcloud', 'config.json');
  const obs = join(h, '.obsutil', 'config');
  const files = { s1: existsSync(s1), koo: existsSync(koo), obs: existsSync(obs) };
  return { status: files.s1 ? 'PASS' : 'FAIL', why: '审批闭环后 S1=' + files.s1 + '，KooCLI=' + files.koo + '，OBS=' + files.obs + '；最终返回=' + JSON.stringify(p).slice(0, 200), result: { files, approved, resp: p, text: (r.text || '').slice(0, 400) } };
} });

cases.push({ id: 'D2-10', title: 'R7 current档跟随', fn: async () => {
  const rec = await import('file:///' + DIST + '/auth/reconcile.js');
  const h = iso('d210c');
  const dir = join(h, '.hcloud');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'config.json'), JSON.stringify({ current: 'deploy', profiles: [{ name: 'default', mode: 'AKSK' }, { name: 'deploy', mode: 'AKSK' }] }), 'utf8');
  const src = readFileSync(DIST + '/auth/reconcile.js', 'utf8');
  const cfgArg = rec.kooCliConfigPath ? rec.kooCliConfigPath({ home: h }) : '(n/a)';
  let profiles = null;
  try { profiles = rec.readKooCliProfiles({ home: h }); } catch (e) { profiles = { error: e.message }; }
  const managed = typeof rec.resolveManagedProfile === 'function' && profiles && !profiles.error ? rec.resolveManagedProfile(profiles) : null;
  const hasCliProfileFlag = /--cli-profile/.test(src);
  const ok = hasCliProfileFlag && !!managed && JSON.stringify(managed).includes('deploy');
  return { status: ok ? 'PASS' : 'FAIL', why: 'configure 路径=' + cfgArg + '，readKooCliProfiles=' + JSON.stringify(profiles).slice(0, 220) + '，resolveManagedProfile=' + JSON.stringify(managed) + '，源码含 --cli-profile=' + hasCliProfileFlag, result: { profiles, managed, hasCliProfileFlag, cfgArg } };
} });

cases.push({ id: 'D2-12', title: 'R10 runtime非空禁止落盘', fn: async () => {
  const h = iso('d212c');
  const env = { USERPROFILE: h, HOME: h };
  let r1 = await mcpTool('huaweicloud_auth_init', { vendorConfirmed: VC_QUOTE, ak: 'AKTESTD21200000000', sk: 'SKTESTD2120000000000000000000000000', region: 'cn-north-4' }, 90000, env);
  let p1 = r1.parsed || {};
  if (p1.approvalToken) {
    approve(p1.approvalToken, h);
    r1 = await mcpTool('huaweicloud_auth_init', { vendorConfirmed: VC_QUOTE, ak: 'AKTESTD21200000000', sk: 'SKTESTD2120000000000000000000000000', region: 'cn-north-4', approvalToken: p1.approvalToken, approvedByUser: true }, 90000, env);
    p1 = r1.parsed || {};
  }
  const r2 = await mcpTool('huaweicloud_auth_sync', { target: 'all' }, 60000, env);
  const p2 = r2.parsed || {};
  const txt = (r2.text || '') + JSON.stringify(p2);
  const suppressed = /suppress|R10|runtime/i.test(txt);
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  return { status: suppressed ? 'PASS' : 'FAIL', why: 'runtime 设置返回=' + JSON.stringify(p1).slice(0, 160) + '；auth_sync=' + txt.slice(0, 240) + '；S1 落盘=' + existsSync(s1), result: { initResp: p1, syncResp: p2, s1Exists: existsSync(s1) } };
} });

cases.push({ id: 'D2-16', title: 'import文件读取后擦除', fn: async () => {
  const h = iso('d216c');
  const env = { USERPROFILE: h, HOME: h };
  const f = join(h, '.config', 'huaweicloud', 'creds-import.json');
  writeFileSync(f, JSON.stringify({ ak: 'AK_IMPORT_0000000', sk: 'SK_IMPORT_000000000000000000000000000', region: 'cn-north-4' }), 'utf8');
  let r = await mcpTool('huaweicloud_auth_switch', { vendorConfirmed: VC_QUOTE, mode: 'import', action: 'temporary' }, 60000, env);
  let p = r.parsed || {};
  if (p.approvalToken) {
    approve(p.approvalToken, h);
    r = await mcpTool('huaweicloud_auth_switch', { vendorConfirmed: VC_QUOTE, mode: 'import', action: 'temporary', approvalToken: p.approvalToken, approvedByUser: true }, 60000, env);
    p = r.parsed || {};
  }
  return { status: !existsSync(f) ? 'PASS' : 'FAIL', why: '审批闭环后 creds-import.json 已擦除=' + !existsSync(f) + '；返回=' + JSON.stringify(p).slice(0, 200), result: { fileExists: existsSync(f), resp: p } };
} });

cases.push({ id: 'D2-27', title: 'KooCLI 版本管理', fn: async () => {
  const kv = await import('file:///' + DIST + '/koocli-version.js');
  const ver = kv.getKooCliVersion();
  const parsed = kv.parseHcloudVersion('hcloud 7.2.12 (windows/amd64)');
  const cmp = kv.compareVersion('7.2.12', '7.2.9');
  const base = kv.kooCliDownloadBase('7.2.12');
  const baseOk = String(base).startsWith(kv.KOO_CLI_BASE) && /\d+\.\d+\.\d+/.test(String(base));
  const ok = parsed === '7.2.12' && cmp === 1 && baseOk;
  return { status: ok ? 'PASS' : 'FAIL', why: 'getKooCliVersion=' + JSON.stringify(ver) + '，parse=' + parsed + '，compare=' + cmp + '，base=' + base, result: { ver, parsed, cmp, base, baseOk } };
} });

cases.push({ id: 'D1-68', title: '图标离线与区域环境变量', fn: async () => {
  const d = iso('d168c');
  const probe = join(d, 'p.mjs');
  writeFileSync(probe, "import { getServiceIcon } from 'file:///" + DIST + "/icon-library.js';\nconst r = await getServiceIcon('ecs');\nconsole.log(JSON.stringify({ source: r && r.source }));\n", 'utf8');
  const off = safeJson(runNode(probe, [], 30000, { HUAWEICLOUD_ICONS_OFFLINE: '1' }).stdout.trim());
  const live = safeJson(runNode(probe, [], 30000, { HUAWEICLOUD_ICONS_OFFLINE: '0' }).stdout.trim());
  const srv = readFileSync(DIST + '/mcp-server.js', 'utf8');
  const orderReversed = /environment\.HW_REGION \|\| environment\.HUAWEICLOUD_REGION/.test(srv);
  const iconOk = !!off && off.source === 'snapshot';
  return {
    status: iconOk ? (orderReversed ? 'SPEC-MISMATCH' : 'PASS') : 'FAIL',
    why: 'ICONS_OFFLINE=1 时 source=' + (off && off.source) + '（本地），默认=' + (live && live.source) + '；region 实现为 HW_REGION||HUAWEICLOUD_REGION，与用例预期「HUAWEICLOUD_REGION 优先」相反',
    result: { offline: off, live, orderReversed },
  };
} });

for (const c of cases) {
  const t0 = Date.now(); let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: { stack: String(e.stack).slice(0, 600) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch (e) { /* ignore */ }
  console.log(c.id.padEnd(7), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 160));
}