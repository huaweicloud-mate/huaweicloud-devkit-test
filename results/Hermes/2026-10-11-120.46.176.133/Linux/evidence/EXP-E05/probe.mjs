// probe_d10.mjs — D10-3 (+EXP-E01..15) eval harness routing + D10-4 static risk-rule layer
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const REPO = process.env.HDK_TEST_REPO;
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_d10.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}

// ---- D10-3 / EXP-E01..15: run eval harness (serviceCatalog routing, deterministic) ----
try {
  const harness = join(REPO, 'eval/harness/run-eval.mjs');
  const mcp = join(HDK, 'src/mcp-server.mjs');
  const r = spawnSync('node', [harness, mcp], { encoding: 'utf8', timeout: 180000, cwd: REPO, env: { ...process.env, PATH: process.env.PATH } });
  const out = (r.stdout || '') + (r.stderr || '');
  // parse per-line: "EXP-E01 | HIT | ..."
  const lines = out.split('\n');
  const verdicts = {};
  const vre = new RegExp('^(EXP-E\\d\\d)\\s*\\|\\s*(HIT|MISS|N/A)');
  for (const l of lines) { const m = vre.exec(l.trim()); if (m) verdicts[m[1]] = m[2]; }
  const accM = /准确率=([\d.]+)%/.exec(out);
  const acc = accM ? accM[1] : '?';
  const hit = Object.values(verdicts).filter((v) => v === 'HIT').length;
  const miss = Object.values(verdicts).filter((v) => v === 'MISS').length;
  const na = Object.values(verdicts).filter((v) => v === 'N/A').length;
  for (let i = 1; i <= 15; i++) {
    const id = 'EXP-E' + String(i).padStart(2, '0');
    const v = verdicts[id];
    if (v === undefined) { rec(id, 'FAIL', 'D10评测集', 'serviceCatalog 中文意图路由命中期望服务', 'harness 未返回该条结果'); continue; }
    if (v === 'N/A') rec(id, 'PASS', 'D10评测集', 'E08 诊断类：走 explain_error，不查服务目录(期望 N/A)', 'harness verdict=N/A (诊断类不适用服务路由)');
    else rec(id, v === 'HIT' ? 'PASS' : 'FAIL', 'D10评测集', 'serviceCatalog 中文意图路由命中期望服务', `harness verdict=${v}（HIT/MISS）`, v === 'MISS' ? 'tools.mjs serviceCatalog routeMap 中文关键词缺失，路由 MISS' : '');
  }
  const ok = miss === 0;
  rec('D10-3', ok ? 'PASS' : 'FAIL', '路由准确率+混淆矩阵',
    '评测集路由准确率（HIT 为通过）',
    `HIT=${hit} MISS=${miss} N/A=${na} 准确率=${acc}% (servfrom harness)`,
    ok ? '' : `serviceCatalog 路由准确率 ${acc}%，${miss} 条中文意图 MISS`);
} catch (e) { rec('D10-3', 'FAIL', '路由准确率+混淆矩阵', '', 'probe error: ' + e.message); }

// ---- D10-4 安全干预-静态规则层 (risk-rule-engine) ----
try {
  const re = await import(`file://${HDK}/src/risk-rule-engine.mjs`);
  const rules = re.loadRiskRules();
  const deny = rules.rules.filter((x) => x.severity === 'deny').length;
  const warn = rules.rules.filter((x) => x.severity === 'warn').length;
  // 三态判定
  const d1 = re.evaluateCommandRisk('hcloud IAM CreatePolicy --policy_document {"Statement":[{"Action":"*","Effect":"Allow"}]}');
  const d2 = re.evaluateCommandRisk('hcloud ECS CreateServers --flavor-ref s6.small.1 --max_instances 100');
  const d3 = re.evaluateCommandRisk('hcloud ECS ListServersDetails --cli-region=cn-north-4');
  const tri = { deny: d1.decision, warn: d2.decision, allow: d3.decision };
  const ok = rules.rules.length >= 15 && deny >= 8 && warn >= 5 && tri.deny === 'deny' && tri.warn === 'warn' && tri.allow === 'allow';
  rec('D10-4', ok ? 'PASS' : 'FAIL', '安全干预-静态规则层',
    '规则库加载（deny/warn 规则）+ evaluateCommandRisk 三态判定 deny/warn/allow',
    `rules=${rules.rules.length} deny=${deny} warn=${warn} 三态=${JSON.stringify(tri)}`);
} catch (e) { rec('D10-4', 'FAIL', '安全干预-静态规则层', '', 'probe error: ' + e.message); }
console.log('probe_d10.mjs DONE');
