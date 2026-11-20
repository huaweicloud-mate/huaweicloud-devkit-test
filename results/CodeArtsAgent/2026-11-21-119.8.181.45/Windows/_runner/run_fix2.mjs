import { mcpSession, finishCall, writeEvidence, writeProbe } from './lib.mjs';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const iso = (tag) => { const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now()); mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
const cases = [];

cases.push({ id: 'D1-31', title: 'dismiss 状态持久化', fn: async () => {
  const uc = await import('file:///' + (await import('./lib.mjs')).DIST + '/update-check.mjs');
  const h = iso('d131');
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = h;
  const p = uc.resolveSkipFilePath();
  uc.writeSkipState(p, '1.1.15', { days: 3 });
  const back = uc.readSkipState(p);
  const r = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, back);
  if (old === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = old;
  const ok = existsSync(p) && !!back && back.dismissedVersion === '1.1.15' && r.result === 'dismissed' && !!r.dismissExpiresAt;
  return { status: ok ? 'PASS' : 'FAIL', why: 'skipFile=' + p + ' 落盘=' + existsSync(p) + ' result=' + r.result + ' expiresAt=' + r.dismissExpiresAt, result: { path: p, state: back, judge: r } };
} });

cases.push({ id: 'D1-42', title: 'dismiss 冷却期 3 天与二次查询', fn: async () => {
  const uc = await import('file:///' + (await import('./lib.mjs')).DIST + '/update-check.mjs');
  const h = iso('d142');
  const file = join(h, 'skip-state.json');
  uc.writeSkipState(file, '1.1.15', { at: Date.now() - 1000, days: 3 });
  const st = uc.readSkipState(file);
  const r1 = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, st);
  const r2 = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, st);
  const delta = st ? new Date(st.expireAt).getTime() - new Date(st.dismissedAt).getTime() : null;
  const ok = delta === 3 * 86400000 && r1.result === 'dismissed' && !!r1.dismissExpiresAt && r2.result === 'dismissed';
  return { status: ok ? 'PASS' : 'FAIL', why: '冷却差=' + delta + '(期望259200000) 首次=' + r1.result + ' 二次=' + r2.result, result: { state: st, first: r1, second: r2, delta } };
} });

cases.push({ id: 'D8-7', title: '7 个 meta/通用技能指引可机械执行', fn: async () => {
  const names = ['huawei-getting-started', 'huawei-ecs', 'huawei-iac', 'huaweicloud-cli-and-auth', 'huaweicloud-safety', 'huaweicloud-capability-discovery', 'huaweicloud-troubleshooting'];
  const msgs = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }];
  names.forEach((n, i) => msgs.push({ jsonrpc: '2.0', id: i + 2, method: 'tools/call', params: { name: 'huaweicloud_retrieve_skill', arguments: { name: n } } }));
  const sess = await mcpSession(msgs, 150000);
  const loaded = names.map((n, i) => { const f = finishCall(sess.responses.find((r) => r.id === i + 2)); return { name: n, ok: !!f.ok, len: (f.text || '').length, head: (f.text || '').slice(0, 100) }; });
  const ok = loaded.every((x) => x.ok && x.len > 500);
  return { status: ok ? 'PASS' : 'FAIL', why: '加载 ' + loaded.filter((x) => x.ok && x.len > 500).length + '/' + loaded.length + ' 个技能：' + loaded.map((x) => x.name + '=' + x.len).join(', '), result: { loaded } };
} });

for (const c of cases) {
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + (e && e.message), result: { stack: String((e && e.stack) || '').slice(0, 700) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch { /* ignore */ }
  console.log(c.id.padEnd(8), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 200));
}
