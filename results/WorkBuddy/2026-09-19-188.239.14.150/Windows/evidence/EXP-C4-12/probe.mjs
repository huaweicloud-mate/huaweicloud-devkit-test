// d5-c4-probe.mjs: WorkBuddy D5 client matrix + C4 service matrix probe
// Tests: EXP-D5-5-1 (plugin discovery), EXP-D5-5-3 (tools/list 40 tools),
//        EXP-C4-01~22 (list_operations + plan_cli_command per service)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.argv[2] || 'C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-2\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';

const SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];

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

const srv = makeServer(serverPath);
console.log('=== D5-C4 Probe Start ===');

// Initialize
const initResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd5-c4-probe', version: '1' } } });
console.log('Initialize OK:', initResp.result?.serverInfo?.name);

srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

// ---- EXP-D5-5-1: Plugin discovery (manifest loadable) ----
console.log('\n--- EXP-D5-5-1: Plugin Discovery ---');
const toolsListResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
const tools = toolsListResp?.result?.tools || [];
const toolNames = tools.map(t => t.name);
console.log(`Tools count: ${tools.length}`);
console.log(`Has huaweicloud_ prefix tools: ${toolNames.filter(n => n.startsWith('huaweicloud_')).length}`);

const d5_1_pass = tools.length > 0 && toolNames.some(n => n.startsWith('huaweicloud_'));
console.log(`EXP-D5-5-1: ${d5_1_pass ? 'PASS' : 'FAIL'} - Plugin manifest discoverable, ${tools.length} tools loaded`);

// ---- EXP-D5-5-3: tools/list 40 tools, schema complete ----
console.log('\n--- EXP-D5-5-3: Tools/List 40 Tools Schema ---');
const hwTools = tools.filter(t => t.name.startsWith('huaweicloud_'));
const toolsWithSchema = hwTools.filter(t => t.inputSchema && t.inputSchema.type === 'object');
const toolsWithDesc = hwTools.filter(t => t.description && t.description.length > 0);
console.log(`huaweicloud_ tools: ${hwTools.length}`);
console.log(`Tools with inputSchema(object): ${toolsWithSchema.length}`);
console.log(`Tools with description: ${toolsWithDesc.length}`);
const d5_3_pass = hwTools.length >= 40 && toolsWithSchema.length === hwTools.length && toolsWithDesc.length === hwTools.length;
console.log(`EXP-D5-5-3: ${d5_3_pass ? 'PASS' : 'FAIL'} - ${hwTools.length} tools, ${toolsWithSchema.length} with schema, ${toolsWithDesc.length} with description`);

// Save D5 evidence
const d5Evidence = {
  d5_5_1: { pass: d5_1_pass, toolsCount: tools.length, hwToolsCount: hwTools.length, toolNames: toolNames.slice(0, 10) },
  d5_5_3: { pass: d5_3_pass, hwToolsCount: hwTools.length, toolsWithSchema: toolsWithSchema.length, toolsWithDesc: toolsWithDesc.length, allToolNames: toolNames }
};

// ---- EXP-C4-01~22: Service matrix list_operations + plan_cli_command ----
console.log('\n--- EXP-C4-01~22: Service Matrix ---');
const c4Results = {};

// Service name mapping for hcloud CLI
const serviceMap = {
  'ECS': 'ECS', 'VPC': 'VPC', 'OBS': 'OBS', 'RDS': 'RDS', 'GaussDB': 'GaussDB',
  'CCE': 'CCE', 'FunctionGraph': 'FunctionGraph', 'IAM': 'IAM', 'CTS': 'CTS',
  'CES': 'CES', 'DDS': 'DDS', 'DCS': 'DCS', 'SMN': 'SMN', 'DMS': 'DMS',
  'WAF': 'WAF', 'CDN': 'CDN', 'ModelArts': 'ModelArts', 'DEW': 'DEW',
  'CBR': 'CBR', 'EVS': 'EVS', 'EIP': 'EIP', 'ELB': 'ELB'
};

for (const svc of SERVICES) {
  const caseId = `EXP-C4-${String(SERVICES.indexOf(svc) + 1).padStart(2, '0')}`;
  console.log(`\n[${caseId}] Service: ${svc}`);

  // list_operations
  let listOk = false;
  let listOutput = '';
  try {
    const listResp = await srv.call('huaweicloud_list_operations', { service: svc, timeoutMs: 30000 });
    const text = listResp?.result?.content?.[0]?.text || '';
    listOutput = text.substring(0, 200);
    listOk = !listResp?.result?.isError && text.length > 0;
    console.log(`  list_operations: ${listOk ? 'OK' : 'FAIL'} - ${text.substring(0, 80)}...`);
  } catch (e) {
    console.log(`  list_operations: ERROR - ${e.message}`);
  }

  // plan_cli_command (read-only planning)
  let planOk = false;
  let planOutput = '';
  try {
    const planResp = await srv.call('huaweicloud_plan_cli_command', { args: [svc, '--help'], allowWrites: false });
    const text = planResp?.result?.content?.[0]?.text || '';
    planOutput = text.substring(0, 200);
    planOk = !planResp?.result?.isError && text.length > 0;
    console.log(`  plan_cli_command: ${planOk ? 'OK' : 'FAIL'} - ${text.substring(0, 80)}...`);
  } catch (e) {
    console.log(`  plan_cli_command: ERROR - ${e.message}`);
  }

  const pass = listOk || planOk;
  c4Results[caseId] = { service: svc, listOk, planOk, pass, listOutput, planOutput };
  console.log(`  ${caseId}: ${pass ? 'PASS' : 'FAIL'}`);
}

// Save summary
const summary = {
  d5: d5Evidence,
  c4: c4Results,
  timestamp: new Date().toISOString()
};

writeFileSync(join(__dirname, 'd5-c4-summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
console.log('\n=== Probe Complete ===');
console.log(`D5-5-1: ${d5_1_pass ? 'PASS' : 'FAIL'}`);
console.log(`D5-5-3: ${d5_3_pass ? 'PASS' : 'FAIL'}`);
const c4Pass = Object.values(c4Results).filter(r => r.pass).length;
console.log(`C4: ${c4Pass}/${SERVICES.length} PASS`);

srv.kill();
process.exit(0);
