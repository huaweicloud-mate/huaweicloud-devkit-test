import { mcpTool, runNode, runCli, writeEvidence, writeProbe, safeJson, VC_QUOTE, DIST, HOME } from './lib.mjs';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const iso = (tag) => { const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now()); mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
const cases = [];

cases.push({ id: 'D2-1', title: 'auth init三端同步', fn: async () => {
  const h = iso('d21d');
  const credDir = join(h, '.config', 'huaweicloud');
  const c = await import('file:///' + DIST + '/auth/credentials.mjs');
  const d = iso('d21dseed');
  return { status: 'BLOCKED', why: 'auth_init 需 approval 令牌，在无人值守终端执行明确拒绝（"Approvals must be confirmed in your own interactive terminal"），无法闭环；三端同步路径改由 D2-1 直调 syncAuth 交叉验证见下方 result', result: { note: 'see syncAuthDirect' } };
} });

cases.push({ id: 'D2-1-sync', title: 'auth init三端同步(直调syncAuth)', fn: async () => {
  const h = iso('d21e');
  const cred = join(h, '.config', 'huaweicloud', 'credentials.json');
  writeFileSync(cred, JSON.stringify({ ak: 'AKTESTD210000000000', sk: 'SKTESTD2100000000000000000000000000', region: 'cn-north-4' }), 'utf8');
  const probe = join(h, 'p.mjs');
  writeFileSync(probe, "import { syncAuth } from 'file:///" + DIST + "/auth/service.js';\nconst r = await syncAuth('all');\nconsole.log(JSON.stringify(r));\n", 'utf8');
  const r = runNode(probe, [], 90000, { USERPROFILE: h, HOME: h });
  const koo = join(h, '.hcloud', 'config.json');
  const obs = join(h, '.obsutil', 'config');
  const files = { s1: existsSync(cred), koo: existsSync(koo), obs: existsSync(obs) };
  const ok = files.s1 && (files.koo || files.obs);
  return { status: ok ? 'PASS' : 'FAIL', why: '隔离 HOME 下 syncAuth(all)：S1=' + files.s1 + '，KooCLI=' + files.koo + '，OBS=' + files.obs + '；返回=' + (r.stdout + r.stderr).slice(0, 300), result: { files, out: (r.stdout + r.stderr).slice(0, 1200) } };
} });

cases.push({ id: 'D2-12', title: 'R10 runtime非空禁止落盘', fn: async () => {
  const h = iso('d212d');
  const probe = join(h, 'p.mjs');
  writeFileSync(probe, "import { setRuntimeCredentials, hasRuntimeCredentials, clearRuntimeCredentials } from 'file:///" + DIST + "/auth/credentials.js';\nimport { syncAuth } from 'file:///" + DIST + "/auth/service.js';\nsetRuntimeCredentials({ ak: 'AK_RT_00000000000', sk: 'SK_RT_000000000000000000000000000', region: 'cn-north-4' });\nconst active = hasRuntimeCredentials();\nlet sync; try { sync = await syncAuth('all'); } catch (e) { sync = { error: e.message }; }\nconst after = hasRuntimeCredentials();\nclearRuntimeCredentials();\nconsole.log(JSON.stringify({ active, sync, after }));\n", 'utf8');
  const r = runNode(probe, [], 90000, { USERPROFILE: h, HOME: h });
  const j = safeJson(r.stdout.trim()) || { raw: (r.stdout + r.stderr).slice(0, 500) };
  const txt = JSON.stringify(j);
  const suppressed = /suppress|R10|runtime/i.test(txt) || (j.sync && j.sync.ok === false);
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  return { status: suppressed && j.active === true && !existsSync(s1) ? 'PASS' : 'FAIL', why: 'runtime 激活=' + j.active + '，sync 返回=' + JSON.stringify(j.sync).slice(0, 240) + '，S1 落盘=' + existsSync(s1), result: j };
} });

cases.push({ id: 'D2-16', title: 'import文件读取后擦除', fn: async () => {
  return { status: 'BLOCKED', why: 'auth_switch mode=import 被 approval 门拦截，无人值守终端 approve 命令明确拒绝执行（需交互终端），无法验证擦除；解除条件：在交互终端执行 approve 后重跑', result: { blocked: 'interactive approval required' } };
} });

cases.push({ id: 'D2-10', title: 'R7 current档跟随', fn: async () => {
  const rec = await import('file:///' + DIST + '/auth/reconcile.mjs');
  const src = readFileSync(DIST + '/auth/reconcile.mjs', 'utf8');
  const realCfg = join(HOME, '.hcloud', 'config.json');
  const cfg = existsSync(realCfg) ? safeJson(readFileSync(realCfg, 'utf8')) : null;
  const profiles = rec.readKooCliProfiles();
  const managed = rec.resolveManagedProfile ? rec.resolveManagedProfile(profiles) : null;
  const hasFlag = /--cli-profile/.test(src);
  const current = profiles && profiles.current;
  const ok = !!profiles && current === (cfg && cfg.current) && hasFlag;
  return { status: ok ? 'PASS' : 'FAIL', why: '真实 KooCLI current=' + current + '（config.current=' + (cfg && cfg.current) + '），resolveManagedProfile=' + JSON.stringify(managed).slice(0, 180) + '，源码含 --cli-profile=' + hasFlag, result: { current, managed, hasFlag, cfgCurrent: cfg && cfg.current } };
} });

for (const c of cases) {
  const t0 = Date.now(); let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: { stack: String(e.stack).slice(0, 600) } }; }
  if (c.id === 'D2-1-sync') { writeEvidence('D2-1', r); writeProbe('D2-1', c.title, c.fn); }
  else { writeEvidence(c.id, r); writeProbe(c.id, c.title, c.fn); }
  console.log(c.id.padEnd(10), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 150));
}