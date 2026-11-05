#!/usr/bin/env node
// v2 service-matrix + functional: list_operations (22 services) + plan + voucher.
// Fresh MCP server spawn per call (robust). Cloud tools vendor-gated → vendorConfirmed.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS = join(__dirname, '..');
const MCP = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist/mcp-server.js';
const REGION = 'cn-north-4';

function ts() { const n = new Date(Date.now() + 8 * 3600 * 1000); return n.toISOString().replace(/[-:T]/g, '').slice(0, 14); }
function emit(id, status, why, result = {}) {
  const d = join(RESULTS, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ caseId: id, status, why, executedAt: ts(), result }, null, 2));
  writeFileSync(join(d, 'probe.mjs'), `// probe for ${id} (v2-service-matrix.mjs) ${ts()}\n// status: ${status} ${why}\n`);
}
function frame(o) { const j = JSON.stringify(o); return `Content-Length: ${Buffer.byteLength(j, 'utf8')}\r\n\r\n${j}`; }
function oneCall(name, args, tmo = 20000) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_VENDOR_CHALLENGE: 'off' } });
    let out = '', err = '';
    const finish = () => {
      const parts = out.split(/Content-Length:\s*\d+\s*\r\n\r\n/).slice(1).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      const tr = parts.find(r => r.id === 2);
      resolve(tr);
    };
    p.stdout.on('data', d => { out += d.toString(); });
    p.stderr.on('data', () => {});
    p.on('exit', finish);
    setTimeout(() => { try { p.stdin.write(frame({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'm', version: '1' } } })); } catch {} }, 100);
    setTimeout(() => { try { p.stdin.write(frame({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } })); } catch {} }, 350);
    setTimeout(() => { try { p.stdin.end(); } catch {} }, tmo - 2000);
    setTimeout(() => { try { p.kill(); } catch {} finish(); }, tmo);
  });
}

const VEND = '华为云';
const services = { 'EXP-C4-01': 'ECS', 'EXP-C4-02': 'VPC', 'EXP-C4-03': 'OBS', 'EXP-C4-04': 'RDS', 'EXP-C4-05': 'GaussDB', 'EXP-C4-06': 'CCE', 'EXP-C4-07': 'FunctionGraph', 'EXP-C4-08': 'IAM', 'EXP-C4-09': 'CTS', 'EXP-C4-10': 'CES', 'EXP-C4-11': 'DDS', 'EXP-C4-12': 'DCS', 'EXP-C4-13': 'SMN', 'EXP-C4-14': 'DMS', 'EXP-C4-15': 'WAF', 'EXP-C4-16': 'CDN', 'EXP-C4-17': 'ModelArts', 'EXP-C4-18': 'DEW', 'EXP-C4-19': 'CBR', 'EXP-C4-20': 'EVS', 'EXP-C4-21': 'EIP', 'EXP-C4-22': 'ELB' };

let pass = 0, fail = 0;
const matrix = [];
for (const [cid, svc] of Object.entries(services)) {
  const resp = await oneCall('huaweicloud_list_operations', { service: svc, vendorConfirmed: VEND });
  const txt = resp?.result?.content?.[0]?.text || '';
  const isErr = resp?.result?.isError || resp?.error || !txt;
  const ok = !isErr && txt.length > 0;
  matrix.push({ svc, ok, snippet: txt.slice(0, 80) });
  emit(cid, ok ? 'PASS' : 'FAIL', `list_operations(${svc}) => ${ok ? 'ok' : 'error/empty'} | ${txt.slice(0, 90)}`, { svc, txt: txt.slice(0, 250) });
  console.log(`  ${cid} ${svc}: ${ok ? 'PASS' : 'FAIL'} - ${txt.slice(0, 70)}`);
  if (ok) pass++; else fail++;
}

const allOk = matrix.every(m => m.ok);
emit('D3-C4', allOk ? 'PASS' : 'FAIL', `service matrix: ${matrix.filter(m => m.ok).length}/${matrix.length} services list_operations ok`, { matrix: matrix.map(m => ({ svc: m.svc, ok: m.ok })) });
console.log(`  D3-C4 (matrix): ${matrix.filter(m => m.ok).length}/${matrix.length} ok`);

const plan = await oneCall('huaweicloud_plan_cli_command', { args: ['VPC', 'ListVpcs', `--cli-region=${REGION}`], allowWrites: false, vendorConfirmed: VEND });
const ptxt = plan?.result?.content?.[0]?.text || '';
const planOk = !plan?.result?.isError && !plan?.error && ptxt.length > 0;
emit('D3-B7', planOk ? 'PASS' : 'FAIL', `plan_cli_command(ListVpcs) => ${ptxt.slice(0, 110)}`, { plan: ptxt.slice(0, 300) });
console.log(`  D3-B7 plan: ${planOk ? 'PASS' : 'FAIL'} - ${ptxt.slice(0, 70)}`);

const vouch = await oneCall('huaweicloud_voucher_status', {}, 15000);
const vtxt = vouch?.result?.content?.[0]?.text || '';
const vOk = !vouch?.result?.isError && !vouch?.error && vtxt.length > 0;
emit('D3-B8', vOk ? 'PASS' : 'FAIL', `voucher_status => ${vtxt.slice(0, 110)}`, { v: vtxt.slice(0, 200) });
console.log(`  D3-B8 voucher: ${vOk ? 'PASS' : 'FAIL'} - ${vtxt.slice(0, 70)}`);

console.log(`\n=== service-matrix done: ${pass} PASS, ${fail} FAIL ===`);
process.exit(0);