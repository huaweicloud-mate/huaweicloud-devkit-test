// expanded-probe.mjs: All expanded-level test probe (2026-09-21)
// Tests: EXP-D5-5-1 (plugin discovery), EXP-D5-5-3 (tools/list 40 tools),
//        EXP-C4-01~22 (service matrix), EXP-E01~E15 (eval harness routing)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.argv[2] || 'C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-2\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const evalCsvPath = process.argv[3] || 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\huaweicloud-devkit-test\\eval\\prompts\\eval-set-v1.csv';

const SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];

const EXPECT = {
  'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'],
  'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null,
  'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'],
  'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'],
};

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
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
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}

function saveEvidence(caseId, status, detail, extra) {
  const dir = join(__dirname, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const log = { status, detail, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14), ...extra };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log, null, 2), 'utf-8');
  writeFileSync(join(dir, 'probe.txt'), `Probe: expanded-probe.mjs\nCase: ${caseId}\nStatus: ${status}\nDetail: ${detail}\nTime: ${new Date().toISOString()}\n`, 'utf-8');
}

const srv = makeServer(serverPath);
const results = {};
console.log('=== Expanded-Level Probe Start (2026-09-21) ===');

// Initialize
const initResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'expanded-probe', version: '1' } } });
console.log('Initialize OK:', initResp.result?.serverInfo?.name);
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

// Get tools list
const toolsListResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
const tools = toolsListResp?.result?.tools || [];
const toolNames = tools.map(t => t.name);
const hwTools = tools.filter(t => t.name.startsWith('huaweicloud_'));

// ---- EXP-D5-5-1: Plugin discovery ----
console.log('\n--- EXP-D5-5-1: Plugin Discovery ---');
{
  const pass = tools.length > 0 && hwTools.length > 0;
  results['EXP-D5-5-1'] = { pass, detail: `Plugin manifest discoverable, ${tools.length} tools loaded, ${hwTools.length} huaweicloud_ tools` };
  saveEvidence('EXP-D5-5-1', pass ? 'PASS' : 'FAIL', results['EXP-D5-5-1'].detail, { toolsCount: tools.length, hwToolsCount: hwTools.length, sampleToolNames: toolNames.slice(0, 10) });
  console.log(`EXP-D5-5-1: ${pass ? 'PASS' : 'FAIL'} - ${results['EXP-D5-5-1'].detail}`);
}

// ---- EXP-D5-5-3: tools/list 40 tools, schema complete ----
console.log('\n--- EXP-D5-5-3: Tools/List 40 Tools Schema ---');
{
  const toolsWithSchema = hwTools.filter(t => t.inputSchema && t.inputSchema.type === 'object');
  const toolsWithDesc = hwTools.filter(t => t.description && t.description.length > 0);
  const pass = hwTools.length >= 40 && toolsWithSchema.length === hwTools.length && toolsWithDesc.length === hwTools.length;
  results['EXP-D5-5-3'] = { pass, detail: `${hwTools.length} tools, ${toolsWithSchema.length} with schema, ${toolsWithDesc.length} with description` };
  saveEvidence('EXP-D5-5-3', pass ? 'PASS' : 'FAIL', results['EXP-D5-5-3'].detail, { hwToolsCount: hwTools.length, toolsWithSchema: toolsWithSchema.length, toolsWithDesc: toolsWithDesc.length, allToolNames: toolNames });
  console.log(`EXP-D5-5-3: ${pass ? 'PASS' : 'FAIL'} - ${results['EXP-D5-5-3'].detail}`);
}

// ---- EXP-C4-01~22: Service matrix ----
console.log('\n--- EXP-C4-01~22: Service Matrix ---');
for (const svc of SERVICES) {
  const caseId = `EXP-C4-${String(SERVICES.indexOf(svc) + 1).padStart(2, '0')}`;
  console.log(`\n[${caseId}] Service: ${svc}`);

  let listOk = false;
  let listOutput = '';
  try {
    const listResp = await srv.call('huaweicloud_list_operations', { service: svc, timeoutMs: 30000 });
    const text = listResp?.result?.content?.[0]?.text || '';
    listOutput = text.substring(0, 300);
    listOk = !listResp?.result?.isError && text.length > 0;
    console.log(`  list_operations: ${listOk ? 'OK' : 'FAIL'} - ${text.substring(0, 80)}...`);
  } catch (e) {
    console.log(`  list_operations: ERROR - ${e.message}`);
  }

  let planOk = false;
  let planOutput = '';
  try {
    const planResp = await srv.call('huaweicloud_plan_cli_command', { args: [svc, '--help'], allowWrites: false });
    const text = planResp?.result?.content?.[0]?.text || '';
    planOutput = text.substring(0, 300);
    planOk = !planResp?.result?.isError && text.length > 0;
    console.log(`  plan_cli_command: ${planOk ? 'OK' : 'FAIL'} - ${text.substring(0, 80)}...`);
  } catch (e) {
    console.log(`  plan_cli_command: ERROR - ${e.message}`);
  }

  const pass = listOk || planOk;
  results[caseId] = { pass, detail: `Service: ${svc}, listOk: ${listOk}, planOk: ${planOk}` };
  saveEvidence(caseId, pass ? 'PASS' : 'FAIL', results[caseId].detail, { service: svc, listOk, planOk, listOutput, planOutput });
  console.log(`  ${caseId}: ${pass ? 'PASS' : 'FAIL'}`);
}

// ---- EXP-E01~E15: Eval harness routing ----
console.log('\n--- EXP-E01~E15: Eval Harness Routing ---');
// Read eval set CSV
const raw = readFileSync(evalCsvPath, 'utf-8').replace(/^\uFEFF/, '');
const lines = raw.trim().split(/\r?\n/);
const header = lines[0].split(',');
const evalRows = lines.slice(1).map((l) => {
  const v = l.split(',');
  const o = {};
  header.forEach((h, i) => (o[h.trim()] = (v[i] || '').trim()));
  return o;
});

const evalResults = [];
for (const r of evalRows) {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: r.prompt });
  const text = resp?.result?.content?.[0]?.text || '';
  let rr = {};
  try { rr = text ? JSON.parse(text) : {}; } catch { rr = {}; }
  const svcs = rr.recommendedServices || [];
  const expect = EXPECT[r.id];
  let verdict;
  let pass;
  if (expect === null) {
    verdict = 'N/A';
    pass = true; // N/A cases are considered PASS (not applicable to routing)
  } else {
    verdict = expect.some((s) => svcs.includes(s)) ? 'HIT' : 'MISS';
    pass = verdict === 'HIT';
  }
  results[r.id] = { pass, detail: `expect=${(expect || []).join('/') || '(N/A)'}, got=${svcs.join('+') || '(empty)'}, verdict=${verdict}` };
  saveEvidence(r.id, pass ? 'PASS' : 'FAIL', results[r.id].detail, { 
    id: r.id, prompt: r.prompt, expected: expect, actual: svcs, verdict,
    responseSnippet: text.slice(0, 300),
    fullResponse: rr
  });
  evalResults.push({ id: r.id, prompt: r.prompt, expect: (expect || []).join('/') || '(N/A)', got: svcs.join('+') || '(empty)', verdict });
  console.log(`${r.id} | ${verdict.padEnd(5)} | expect=${(expect || []).join('/') || '(N/A)'} | got=${svcs.join('+') || '(empty)'} | ${r.prompt.slice(0, 24)}`);
}

const hit = evalResults.filter((r) => r.verdict === 'HIT').length;
const miss = evalResults.filter((r) => r.verdict === 'MISS').length;
const na = evalResults.filter((r) => r.verdict === 'N/A').length;
const denom = hit + miss;
const accuracy = denom ? ((hit / denom) * 100).toFixed(1) : 'N/A';
console.log(`\n=== Eval Routing Accuracy ===`);
console.log(`HIT=${hit} MISS=${miss} N/A=${na} | accuracy=${accuracy}% (denom=HIT+MISS=${denom})`);

// Update D10-3 result based on eval
const d10_3_pass = denom > 0 && (hit / denom) >= 0.9;
results['D10-3-overall'] = { pass: d10_3_pass, detail: `EXP-E01~E15: ${hit} HIT, ${miss} MISS, ${na} N/A; accuracy=${accuracy}% < 90% target` };

// Save eval results CSV
const evalCsvOut = ['id,prompt,expectedServices,actualServices,verdict']
  .concat(evalResults.map((r) => `"${r.id}","${r.prompt}","${r.expect}","${r.got.replace(/"/g, '""')}",${r.verdict}`))
  .join('\n') + '\n';
writeFileSync(join(__dirname, 'eval-run-result.csv'), evalCsvOut, 'utf-8');

// Save summary
const allResults = {};
for (const [k, v] of Object.entries(results)) {
  allResults[k] = { pass: v.pass, detail: v.detail };
}
writeFileSync(join(__dirname, 'expanded-summary.json'), JSON.stringify(allResults, null, 2), 'utf-8');

const passCount = Object.values(results).filter(r => r.pass === true).length;
const failCount = Object.values(results).filter(r => r.pass === false).length;
console.log(`\n=== Expanded Probe Complete ===`);
console.log(`PASS: ${passCount}, FAIL: ${failCount}`);
console.log(`Eval: HIT=${hit} MISS=${miss} N/A=${na} accuracy=${accuracy}%`);

srv.kill();
process.exit(0);
