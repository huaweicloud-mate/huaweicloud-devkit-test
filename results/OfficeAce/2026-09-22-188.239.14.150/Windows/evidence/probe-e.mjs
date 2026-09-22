// AI生成
// EXP-E 评测集探针: 15条评测意图的 serviceCatalog 路由测试
// 使用 run-eval.mjs harness 执行, 获取真实路由结论, 为每条意图生成独立 stdout.log
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname_eval = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\huaweicloud-devkit-test\\eval\\harness';
const EVIDENCE_BASE = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-09-22-188.239.14.150\\Windows\\evidence';
const MCP_SERVER = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const NODE = process.execPath;
const ts = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

// 期望路由映射 (from run-eval.mjs)
const EXPECT = {
  'EXP-E01': { services: ['ECS'], action: 'read', desc: 'ECS查询→run_readonly' },
  'EXP-E02': { services: ['ECS'], action: 'plan', desc: 'ECS创建→plan/approve' },
  'EXP-E03': { services: ['OBS'], action: 'deploy', desc: 'OBS静态站→deploy' },
  'EXP-E04': { services: ['EIP'], action: 'plan', desc: 'EIP→plan' },
  'EXP-E05': { services: ['RDS'], action: 'read', desc: 'RDS查询→read' },
  'EXP-E06': { services: ['DCS'], action: 'plan', desc: 'DCS创建→plan' },
  'EXP-E07': { services: ['CBR'], action: 'plan', desc: 'CBR→plan' },
  'EXP-E08': { services: null, action: '诊断', desc: 'explain_error→诊断' },
  'EXP-E09': { services: ['CCE'], action: 'plan', desc: 'CCE创建→plan' },
  'EXP-E10': { services: ['FunctionGraph'], action: 'plan', desc: 'FunctionGraph→plan' },
  'EXP-E11': { services: ['BSS'], action: 'read', desc: '费用查询→read' },
  'EXP-E12': { services: ['CES'], action: 'plan', desc: 'CES→plan' },
  'EXP-E13': { services: ['ELB'], action: 'plan', desc: '证书/ELB→plan' },
  'EXP-E14': { services: ['IAM'], action: 'read', desc: 'IAM审计→read' },
  'EXP-E15': { services: ['Incentive Voucher'], action: '执行', desc: 'voucher_claim→执行' },
};

// 读 eval-set-v1.csv 获取 prompts
const csvPath = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\huaweicloud-devkit-test\\eval\\prompts\\eval-set-v1.csv';
const raw = readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
const lines = raw.trim().split(/\r?\n/);
const header = lines[0].split(',');
const evalRows = lines.slice(1).map((l) => {
  // Handle commas in quoted fields
  const v = [];
  let cur = '', inQ = false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '"') { inQ = !inQ; continue; }
    if (l[i] === ',' && !inQ) { v.push(cur); cur = ''; continue; }
    cur += l[i];
  }
  v.push(cur);
  const o = {};
  header.forEach((h, i) => (o[h.trim()] = (v[i] || '').trim()));
  return o;
});

console.log(`读取到 ${evalRows.length} 条评测意图`);

// ---- MCP JSON-RPC 帧封装 ----
function makeServer(serverPath) {
  const child = spawn(NODE, [serverPath], {
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
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  child.stderr.on('data', (d) => {
    // Log server stderr but don't crash
    const text = d.toString();
    if (!text.includes('Warning') && !text.includes('ExperimentalWarning')) {
      console.error('[server stderr]', text.slice(0, 200));
    }
  });
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}

// ---- 主流程 ----
console.log(`启动 MCP server: ${MCP_SERVER}`);
const srv = makeServer(MCP_SERVER);

// 初始化
const initResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe-eval', version: '1' } } });
console.log(`MCP server 初始化: ${initResp?.result?.serverInfo?.name || 'ok'}`);
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

const summary = [];

for (const r of evalRows) {
  const caseDir = join(EVIDENCE_BASE, r.id);
  mkdirSync(caseDir, { recursive: true });

  const expect = EXPECT[r.id];
  const result = {
    caseId: r.id,
    prompt: r.prompt,
    expectedRoute: r['期望路由'],
    expectedAction: r['期望动作'],
    expectedServices: expect?.services || null,
    probeType: 'EXP-E-serviceCatalog-eval',
    steps: {},
    status: 'UNKNOWN',
    why: '',
    executedAt: ts(),
  };

  // 调用 huaweicloud_service_catalog
  let resp, routeResult = {}, svcs = [];
  try {
    resp = await srv.call('huaweicloud_service_catalog', { intent: r.prompt });
    const text = resp?.result?.content?.[0]?.text || '';
    result.steps.serviceCatalogCall = {
      tool: 'huaweicloud_service_catalog',
      intent: r.prompt,
      responseLength: text.length,
      responsePreview: text.slice(0, 500),
    };
    try { routeResult = text ? JSON.parse(text) : {}; } catch { routeResult = { rawText: text.slice(0, 500) }; }
    svcs = routeResult.recommendedServices || routeResult.services || [];
    result.steps.serviceCatalogCall.recommendedServices = svcs;
    result.steps.serviceCatalogCall.parsedKeys = Object.keys(routeResult);
  } catch (e) {
    result.steps.serviceCatalogCall = { error: e.message || String(e) };
  }

  // 判定
  let verdict;
  if (expect?.services === null) {
    verdict = 'N/A';
  } else {
    verdict = expect.services.some((s) => svcs.includes(s)) ? 'HIT' : 'MISS';
  }

  result.verdict = verdict;
  result.actualServices = svcs;

  if (verdict === 'N/A') {
    result.status = 'PASS';
    result.why = `${r.id}: 诊断类意图(explain_error), serviceCatalog路由标记为N/A`;
  } else if (verdict === 'HIT') {
    result.status = 'PASS';
    result.why = `${r.id}: 路由命中 期望=${expect.services.join('/')} 实际=${svcs.join('+')}`;
  } else {
    result.status = 'FAIL';
    result.why = `${r.id}: 路由未命中 期望=${expect.services.join('/')} 实际=${svcs.join('+') || '(空)'}`;
  }

  writeFileSync(join(caseDir, 'stdout.log'), JSON.stringify(result, null, 2), 'utf-8');
  summary.push({ id: r.id, status: result.status, verdict, why: result.why });
  console.log(`${r.id} | ${result.status} | ${verdict} | ${result.why}`);
}

srv.kill();

console.log(`\n=== EXP-E 汇总 ===`);
const pass = summary.filter(s => s.status === 'PASS').length;
const fail = summary.filter(s => s.status === 'FAIL').length;
const hit = summary.filter(s => s.verdict === 'HIT').length;
const miss = summary.filter(s => s.verdict === 'MISS').length;
const na = summary.filter(s => s.verdict === 'N/A').length;
console.log(`PASS=${pass} FAIL=${fail} | HIT=${hit} MISS=${miss} N/A=${na} | 路由准确率=${hit + miss > 0 ? ((hit / (hit + miss)) * 100).toFixed(1) : 'N/A'}%`);
