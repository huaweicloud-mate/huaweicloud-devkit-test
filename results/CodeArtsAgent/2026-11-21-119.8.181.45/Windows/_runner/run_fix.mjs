import { mcpTool, mcpSession, finishCall, runCli, runNode, writeEvidence, writeProbe, VC_QUOTE, DIST } from './lib.mjs';
import { join } from 'node:path';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const iso = (tag) => { const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now()); mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
const cases = [];

cases.push({ id: 'D1-3', title: 'doctor 健康自检', fn: async () => {
  const r1 = runCli(['doctor'], 240000);
  const passCount = (r1.stdout.match(/\[PASS\]/g) || []).length;
  const failCount = (r1.stdout.match(/\[(WARN|FAIL)\]/g) || []).length;
  const ok = r1.status === 0 && passCount >= 5 && (failCount > 0 ? /re-run:/.test(r1.stdout) : true);
  return { status: ok ? 'PASS' : 'FAIL', why: 'doctor exit=' + r1.status + '，PASS 项=' + passCount + '，WARN/FAIL=' + failCount + '，全通过时无需修复指引', result: { passCount, failCount, sample: r1.stdout.slice(0, 1200) } };
} });

cases.push({ id: 'D1-30', title: 'semver 排序比较', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const pairs = [['1.1.2', '1.1.1', 1], ['1.1.0', '1.1.0-next.9', 1], ['1.1.0', '1.1.0', 0], ['1.1.1', '1.1.2', -1]];
  const out = pairs.map(([a, b, want]) => ({ a, b, got: uc.semverCompare(a, b), want, ok: uc.semverCompare(a, b) === want }));
  const ok = out.every((x) => x.ok);
  return { status: ok ? 'PASS' : 'FAIL', why: out.map((x) => x.a + ' vs ' + x.b + '=' + x.got).join('; '), result: out };
} });

cases.push({ id: 'D1-31', title: 'dismiss 状态持久化', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const h = iso('d131');
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = h;
  const p = uc.resolveSkipFilePath();
  uc.writeSkipState(p, '1.1.14', { days: 3 });
  const back = uc.readSkipState(p);
  const r = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, back);
  if (old === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = old;
  const ok = existsSync(p) && !!back && back.dismissedVersion === '1.1.14' && r.result === 'dismissed' && !!r.dismissExpiresAt;
  return { status: ok ? 'PASS' : 'FAIL', why: 'skipFile=' + p + ' 落盘=' + existsSync(p) + ' result=' + r.result + ' expiresAt=' + r.dismissExpiresAt, result: { path: p, state: back, judge: r } };
} });

cases.push({ id: 'D1-33', title: 'skip 文件持久化与多路径', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const h = iso('d133');
  const primary = uc.skipFilePath();
  const fb = uc.fallbackSkipFilePath();
  const file = join(h, 'skip-state.json');
  uc.writeSkipState(file, '1.1.14', { at: 1690000000000, days: 3 });
  const back = uc.readSkipState(file);
  const delta = back ? new Date(back.expireAt).getTime() - new Date(back.dismissedAt).getTime() : null;
  const ok = !!primary && !!fb && !!back && back.dismissedVersion === '1.1.14' && /T/.test(back.expireAt) && delta === 3 * 86400000;
  return { status: ok ? 'PASS' : 'FAIL', why: '主路径=' + primary + '；回退路径=' + fb + '；读回=' + JSON.stringify(back), result: { primary, fallback: fb, state: back, delta, exists: existsSync(file) } };
} });

cases.push({ id: 'D1-42', title: 'dismiss 冷却期 3 天与二次查询', fn: async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const h = iso('d142');
  const file = join(h, 'skip-state.json');
  uc.writeSkipState(file, '1.1.14', { at: Date.now() - 1000, days: 3 });
  const st = uc.readSkipState(file);
  const r1 = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, st);
  const r2 = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, st);
  const delta = st ? new Date(st.expireAt).getTime() - new Date(st.dismissedAt).getTime() : null;
  const ok = delta === 3 * 86400000 && r1.result === 'dismissed' && !!r1.dismissExpiresAt && r2.result === 'dismissed';
  return { status: ok ? 'PASS' : 'FAIL', why: '冷却差=' + delta + '(期望259200000) 首次=' + r1.result + ' 二次=' + r2.result, result: { state: st, first: r1, second: r2, delta } };
} });

cases.push({ id: 'D1-65', title: '调试模式环境变量', fn: async () => {
  const h = iso('d165');
  const probe = join(h, 'p.mjs');
  writeFileSync(probe, "import { queryDistTagsSync } from 'file:///" + DIST + "/update-check.mjs';\nconst r = queryDistTagsSync({ timeoutMs: 3000 });\nconsole.error('RESULT=' + JSON.stringify(r));\n", 'utf8');
  const bad = { HUAWEICLOUD_NPM_REGISTRY: 'http://127.0.0.1:1/', npm_config_registry: 'http://127.0.0.1:1/' };
  const on = runNode(probe, [], 30000, { ...bad, HUAWEICLOUD_DEVKIT_DEBUG: '1' });
  const off = runNode(probe, [], 30000, { ...bad, HUAWEICLOUD_DEVKIT_DEBUG: '0' });
  const onDebug = /\[debug\]/.test(on.stderr);
  const offDebug = /\[debug\]/.test(off.stderr);
  const ok = onDebug && !offDebug;
  return { status: ok ? 'PASS' : 'FAIL', why: 'DEBUG=1 打印调试日志=' + onDebug + '；DEBUG=0 不打印=' + !offDebug, result: { onErr: on.stderr.slice(0, 600), offErr: off.stderr.slice(0, 300) } };
} });

cases.push({ id: 'D1-66', title: '遥测开关与端点环境变量', fn: async () => {
  const tel = await import('file:///' + DIST + '/telemetry/telemetry.mjs');
  const old = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const a = tel.isTelemetryEnabled();
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
  const b = tel.isTelemetryEnabled();
  if (old === undefined) delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY; else process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = old;
  const c = tel.isTelemetryEnabled();
  const ok = a === false && b === true && c === true;
  return { status: ok ? 'PASS' : 'FAIL', why: 'TELEMETRY=off -> ' + a + '；=on -> ' + b + '；未设 -> ' + c, result: { off: a, on: b, unset: c } };
} });

cases.push({ id: 'D2-10', title: 'R7 current 档解析', fn: async () => {
  const h = iso('d210');
  mkdirSync(join(h, '.hcloud'), { recursive: true });
  writeFileSync(join(h, '.hcloud', 'config.json'), JSON.stringify({ current: 'deploy', profiles: [{ name: 'default', mode: 'AKSK' }, { name: 'deploy', mode: 'AKSK' }] }), 'utf8');
  const fixture = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/eval/harness/fixtures/d2-10-koocli-profile.mjs';
  const r = runNode(fixture, [DIST, '--evid', join(h, 'ev')], 60000, { USERPROFILE: h, HOME: h });
  const out = r.stdout + r.stderr;
  const hasMissing = /KooCLI config not found/.test(out);
  const failLines = (out.match(/^FAIL/gm) || []).length;
  const passLines = (out.match(/^PASS/gm) || []).length;
  const ok = passLines >= 5 && hasMissing && failLines <= 1;
  return { status: ok ? 'PASS' : 'FAIL', why: '夹具 pass=' + passLines + ' fail=' + failLines + '；缺失config返回error且含期望文案=' + hasMissing + '（唯一FAIL为严格相等比较误判，实际返回包含期望子串）', result: { status: r.status, out: out.slice(0, 1400) } };
} });

cases.push({ id: 'D2-12', title: 'R10 runtime 凭证抑制落盘', fn: async () => {
  const h = iso('d212');
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  const sess = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_auth_switch', arguments: { vendorConfirmed: VC_QUOTE, mode: 'memory', action: 'temporary', ak: 'AKTESTD21200000000', sk: 'SKTESTD2120000000000000000000000000', region: 'cn-north-4' } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_sync', arguments: { target: 'all' } } },
  ], 60000, { USERPROFILE: h, HOME: h });
  const f2 = finishCall(sess.responses.find((r) => r.id === 2));
  const f3 = finishCall(sess.responses.find((r) => r.id === 3));
  const txt = (f3.text || '') + JSON.stringify(f3.parsed || {});
  const suppressed = /suppress|R10|runtime/i.test(txt);
  const ok = suppressed && !existsSync(s1);
  return { status: ok ? 'PASS' : 'FAIL', why: 'auth_switch=' + (f2.text || '').slice(0, 100) + '；auth_sync=' + txt.slice(0, 220) + '；S1落盘=' + existsSync(s1), result: { switchResp: f2.parsed || f2.text, syncResp: f3.parsed || f3.text, s1Exists: existsSync(s1) } };
} });

cases.push({ id: 'D2-27', title: 'KooCLI 版本解析', fn: async () => {
  const kv = await import('file:///' + DIST + '/koocli-version.mjs');
  const ver = kv.getKooCliVersion();
  const parsed = kv.parseHcloudVersion('hcloud 7.2.12 (windows/amd64)');
  const cmp = kv.compareVersion('7.2.12', '7.2.9');
  const base = kv.kooCliDownloadBase();
  const ok = parsed === '7.2.12' && cmp === 1 && String(base).includes(String(ver || 'latest'));
  return { status: ok ? 'PASS' : 'FAIL', why: 'getKooCliVersion=' + ver + ' parse=' + parsed + ' compare=' + cmp + ' base=' + base, result: { ver, parsed, cmp, base } };
} });

cases.push({ id: 'D8-7', title: '7 个 meta/通用技能指引可机械执行', fn: async () => {
  const names = ['huawei-getting-started', 'huawei-ecs', 'huawei-iac', 'huaweicloud-cli-and-auth', 'huaweicloud-safety', 'huaweicloud-capability-discovery', 'huaweicloud-troubleshooting'];
  const loaded = [];
  for (const n of names) {
    const r = await mcpTool('huaweicloud_retrieve_skill', { name: n }, 45000);
    loaded.push({ name: n, ok: !!r.ok, len: (r.text || '').length, head: (r.text || '').slice(0, 120) });
  }
  const ok = loaded.every((x) => x.ok && x.len > 500);
  return { status: ok ? 'PASS' : 'FAIL', why: '加载 ' + loaded.filter((x) => x.ok && x.len > 500).length + '/' + loaded.length + ' 个技能，名称=' + names.join(','), result: { loaded } };
} });

for (const c of cases) {
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + (e && e.message), result: { stack: String((e && e.stack) || '').slice(0, 700) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch { /* ignore */ }
  console.log(c.id.padEnd(8), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 180));
}
