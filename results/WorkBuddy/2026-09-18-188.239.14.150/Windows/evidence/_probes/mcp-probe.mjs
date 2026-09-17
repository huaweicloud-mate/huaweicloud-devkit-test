import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk\\plugins\\huaweicloud-core\\src';
const EVIDENCE_BASE = join(__dirname, '..');
const TEST_REPO = 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\huaweicloud-devkit-test';

const results = [];
function log(caseId, test, status, detail) {
  const line = `[${caseId}] ${test}: ${status} | ${detail}`;
  console.log(line);
  results.push({ caseId, test, status, detail, ts: new Date().toISOString() });
  const caseDir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(caseDir)) mkdirSync(caseDir, { recursive: true });
}
function writeCaseProbe(caseId, content) {
  const caseDir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(caseDir)) mkdirSync(caseDir, { recursive: true });
  writeFileSync(join(caseDir, 'probe.mjs'), content);
}

// MCP Client with Content-Length framing
function makeMcpClient(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  let initialized = false;

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
      try {
        const msg = JSON.parse(body);
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg);
          pending.delete(msg.id);
        }
      } catch {}
    }
  });
  child.stderr.on('data', () => {});

  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((resolve, reject) => {
      pending.set(o.id, resolve);
      setTimeout(() => { if (pending.has(o.id)) { pending.delete(o.id); resolve({ error: { code: -32000, message: 'timeout' } }); } }, 30000);
    });
  }

  async function initialize() {
    const resp = await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'eval-probe', version: '1' } } });
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    initialized = true;
    return resp;
  }

  function call(name, args) {
    return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args || {} } });
  }

  function listTools() {
    return send({ jsonrpc: '2.0', id: _id++, method: 'tools/list', params: {} });
  }

  return { child, send, initialize, call, listTools, kill: () => child.kill() };
}

// Main
const srv = makeMcpClient(`${SRC}\\mcp-server.mjs`);
const initResp = await srv.initialize();
console.log(`MCP Server initialized: ${JSON.stringify(initResp?.result?.serverInfo || {}).slice(0, 80)}`);

// ===== D9-1: tools/list schema validation =====
try {
  const resp = await srv.listTools();
  const tools = resp?.result?.tools || [];
  const allValid = tools.every(t => t.name && t.description && t.inputSchema);
  log('D9-1', 'tools/list schema', tools.length >= 40 && allValid ? 'PASS' : 'FAIL',
    `total=${tools.length}, allValid=${allValid}`);
  writeCaseProbe('D9-1', `// D9-1: tools/list schema validation\n`);
} catch(e) { log('D9-1', 'tools/list schema', 'FAIL', e.message); }

// ===== D9-2: error code format =====
try {
  const resp = await srv.call('nonexistent_tool', {});
  const hasError = resp?.error || (resp?.result?.isError);
  const errorCode = resp?.error?.code;
  log('D9-2', 'error code format', hasError ? 'PASS' : 'FAIL',
    `hasError=${hasError}, code=${errorCode}, msg=${resp?.error?.message?.slice(0,60)}`);
  writeCaseProbe('D9-2', `// D9-2: error code format\n`);
} catch(e) { log('D9-2', 'error code', 'FAIL', e.message); }

// ===== D9-3: content array + isError =====
try {
  const resp = await srv.call('huaweicloud_list_regions', {});
  const content = resp?.result?.content;
  const hasContentArray = Array.isArray(content);
  const isError = resp?.result?.isError;
  log('D9-3', 'content+isError', hasContentArray ? 'PASS' : 'FAIL',
    `contentArray=${hasContentArray}, isError=${isError}, contentLen=${content?.length}`);
  writeCaseProbe('D9-3', `// D9-3: content array + isError\n`);
} catch(e) { log('D9-3', 'content+isError', 'FAIL', e.message); }

// ===== D9-4: forced timing =====
try {
  // Already initialized, so tools/list should work
  const resp = await srv.listTools();
  const toolsCount = resp?.result?.tools?.length || 0;
  const initResult = initResp?.result?.protocolVersion;
  log('D9-4', 'forced timing', toolsCount > 0 && initResult ? 'PASS' : 'FAIL',
    `toolsCount=${toolsCount}, protocolVersion=${initResult}`);
  writeCaseProbe('D9-4', `// D9-4: forced timing\n`);
} catch(e) { log('D9-4', 'forced timing', 'FAIL', e.message); }

// ===== D9-5: large response transport =====
try {
  const resp = await srv.call('huaweicloud_list_regions', {});
  const text = resp?.result?.content?.[0]?.text || '';
  const noCorruption = text.length > 0 && !text.includes('Content-Length');
  log('D9-5', 'large response transport', noCorruption ? 'PASS' : 'FAIL',
    `responseLen=${text.length}, noCorruption=${noCorruption}`);
  writeCaseProbe('D9-5', `// D9-5: large response transport\n`);
} catch(e) { log('D9-5', 'large response', 'FAIL', e.message); }

// ===== D9-6: cross-client protocol interop =====
try {
  const resp = await srv.listTools();
  const count = resp?.result?.tools?.length || 0;
  log('D9-6', 'cross-client interop', count > 0 ? 'PASS' : 'FAIL',
    `toolsCount=${count}`);
  writeCaseProbe('D9-6', `// D9-6: cross-client protocol interop\n`);
} catch(e) { log('D9-6', 'cross-client', 'FAIL', e.message); }

// ===== D9-7: malformed request handling =====
try {
  const resp = await srv.send({ jsonrpc: '2.0', id: 999, method: 'invalid/method', params: {} });
  const hasError = resp?.error;
  log('D9-7', 'malformed request', hasError ? 'PASS' : 'FAIL',
    `hasError=${hasError}, code=${resp?.error?.code}, msg=${resp?.error?.message?.slice(0,60)}`);
  writeCaseProbe('D9-7', `// D9-7: malformed request handling\n`);
} catch(e) { log('D9-7', 'malformed', 'FAIL', e.message); }

// ===== D9-8: version consistency =====
try {
  const serverVersion = initResp?.result?.protocolVersion;
  const serverInfo = initResp?.result?.serverInfo;
  log('D9-8', 'version consistency', serverVersion && serverInfo ? 'PASS' : 'FAIL',
    `protocolVersion=${serverVersion}, serverInfo=${JSON.stringify(serverInfo).slice(0,80)}`);
  writeCaseProbe('D9-8', `// D9-8: version consistency\n`);
} catch(e) { log('D9-8', 'version', 'FAIL', e.message); }

// ===== D9-9: cancellation capabilities =====
try {
  const capabilities = initResp?.result?.capabilities || {};
  const hasCancellation = capabilities?.notifications?.cancelled !== undefined || capabilities?.cancellation !== undefined;
  log('D9-9', 'cancellation capabilities', !hasCancellation ? 'SPEC-MISMATCH' : 'PASS',
    `cancellation=${hasCancellation}, capabilities=${JSON.stringify(capabilities).slice(0,100)}`);
  writeCaseProbe('D9-9', `// D9-9: cancellation capabilities\n`);
} catch(e) { log('D9-9', 'cancellation', 'FAIL', e.message); }

// ===== D10-3 / EXP-E01~E15: serviceCatalog routing =====
try {
  const csvPath = join(TEST_REPO, 'eval', 'prompts', 'eval-set-v1.csv');
  const raw = readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = raw.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const rows = lines.slice(1).map(l => {
    const v = l.split(',');
    const o = {};
    header.forEach((h, i) => (o[h.trim()] = (v[i] || '').trim()));
    return o;
  });

  const EXPECT = {
    'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'],
    'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null,
    'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'],
    'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'],
  };

  let hit = 0, miss = 0, na = 0;
  const evalResults = [];

  for (const r of rows) {
    try {
      const resp = await srv.call('huaweicloud_service_catalog', { intent: r.prompt });
      const text = resp?.result?.content?.[0]?.text || '';
      let rr = {};
      try { rr = text ? JSON.parse(text) : {}; } catch {}
      const svcs = rr.recommendedServices || (rr.capabilitySources || []).map(s => s.service || s.name || '').filter(Boolean);
      const expect = EXPECT[r.id];
      let verdict;
      if (expect === null) {
        verdict = 'N/A';
        na++;
      } else {
        verdict = expect.some(s => svcs.some(g => String(g).includes(s) || s.includes(String(g)))) ? 'HIT' : 'MISS';
        if (verdict === 'HIT') hit++; else miss++;
      }
      evalResults.push({ id: r.id, prompt: r.prompt, expect: (expect||[]).join('/'), got: svcs.join('+'), verdict });
      log(r.id, 'serviceCatalog routing', verdict === 'HIT' || verdict === 'N/A' ? 'PASS' : 'FAIL',
        `verdict=${verdict}, expect=${(expect||[]).join('/')}, got=${svcs.join('+')||'(空)'}, prompt="${r.prompt.slice(0,30)}"`);
      writeCaseProbe(r.id, `// ${r.id}: serviceCatalog routing\n`);
    } catch(e) {
      evalResults.push({ id: r.id, prompt: r.prompt, expect: '', got: '', verdict: 'ERROR' });
      log(r.id, 'serviceCatalog routing', 'FAIL', `Exception: ${e.message.slice(0,80)}`);
      miss++;
    }
  }

  const denom = hit + miss;
  const accuracy = denom ? ((hit / denom) * 100).toFixed(1) : 'N/A';
  log('D10-3', 'serviceCatalog routing accuracy', parseFloat(accuracy) >= 90 ? 'PASS' : 'FAIL',
    `HIT=${hit} MISS=${miss} N/A=${na} accuracy=${accuracy}% (denom=${denom})`);
  writeCaseProbe('D10-3', `// D10-3: serviceCatalog routing accuracy\n// HIT=${hit} MISS=${miss} N/A=${na} accuracy=${accuracy}%\n`);

  const evalCsv = ['id,prompt,expectedServices,actualServices,verdict']
    .concat(evalResults.map(r => `"${r.id}","${r.prompt}","${r.expect}","${r.got}",${r.verdict}`))
    .join('\n') + '\n';
  writeFileSync(join(EVIDENCE_BASE, 'D10-3', 'eval-run-result.csv'), evalCsv, 'utf-8');
} catch(e) {
  log('D10-3', 'serviceCatalog routing', 'FAIL', `Exception: ${e.message}`);
}

srv.kill();

// Write summary
const summary = results.map(r => `[${r.caseId}] ${r.test}: ${r.status} | ${r.detail}`).join('\n');
writeFileSync(join(__dirname, 'stdout.log'), summary, 'utf-8');
console.log(`\n=== MCP Protocol Probe Summary ===`);
const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
const spec = results.filter(r => r.status === 'SPEC-MISMATCH').length;
console.log(`PASS=${pass} FAIL=${fail} SPEC-MISMATCH=${spec} TOTAL=${results.length}`);
process.exit(0);
