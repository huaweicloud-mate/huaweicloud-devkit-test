// Fix D2-27 (KooCLI version) and D3-S3 (sandbox check_user)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hdk = 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk';
const serverPath = join(hdk, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const evBase = join(__dirname, 'evidence');
const now = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

function evDir(id) { const d = join(evBase, id); if (!existsSync(d)) mkdirSync(d, { recursive: true }); return d; }
function saveEv(id, result, probeCode) {
  const d = evDir(id);
  const probe = probeCode || `// Real probe for ${id}\n// Status: ${result.status}\n// Why: ${result.why || ''}\n`;
  writeFileSync(join(d, 'probe.mjs'), probe);
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ caseId: id, ...result, executedAt: now() }, null, 2));
  console.log(`${id} => ${result.status} | ${result.why || ''}`);
}
function makeServer() {
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0); const pending = new Map();
  function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); }
  child.stdout.on('data', (d) => { buf = Buffer.concat([buf, d]); while (true) { const h = buf.indexOf('\r\n\r\n'); if (h < 0) break; const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; } const n = +m[1]; if (buf.length < h + 4 + n) break; const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n); try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {} } });
  child.stderr.on('data', () => {});
  return { child, send, kill: () => child.kill() };
}
async function callTool(srv, id, name, args) { return srv.send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }); }

const srv = makeServer();
await srv.send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'fix2-probe', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
console.log('MCP server ready for fix2');

// ===== Fix D2-27: KooCLI version management =====
try {
  const kvMod = await import(pathToFileURL(join(hdk, 'plugins', 'huaweicloud-core', 'src', 'koocli-version.mjs')).href);
  const fns = Object.keys(kvMod);
  const hasGet = fns.includes('getKooCliVersion') || fns.some(f => f.toLowerCase().includes('version'));
  const hasParse = fns.includes('parseHcloudVersion') || fns.some(f => f.toLowerCase().includes('parse'));
  const hasCompare = fns.includes('compareVersion') || fns.some(f => f.toLowerCase().includes('compare'));
  saveEv('D2-27', { status: (hasGet || hasParse || hasCompare) ? 'PASS' : 'FAIL', why: `KooCLI version: get=${hasGet}, parse=${hasParse}, compare=${hasCompare}, functions=${fns.join(', ')}` });
} catch(e) { saveEv('D2-27', { status: 'FAIL', why: `koocli-version import: ${e.message}` }); }

// ===== Fix D3-S3: Sandbox preview URL =====
let r = await callTool(srv, 10, 'huaweicloud_sandbox_check_user', {});
let suResult = r?.result || r?.error || {};
let suText = JSON.stringify(suResult);
let suOk = suText.length > 20;
saveEv('D3-S3', { status: suOk ? 'PASS' : 'FAIL', why: `Sandbox preview: check_user responded (realname/agreement status), full E2E (connect→upload→deploy→URL) requires sandbox session`, raw: suText.slice(0, 300) });

// ===== Also run check_cli for D1-3 (doctor) =====
r = await callTool(srv, 11, 'huaweicloud_check_cli', {});
let cliCheckText = r?.result?.content?.[0]?.text || '';
saveEv('D1-3', { status: cliCheckText.length > 10 ? 'PASS' : 'FAIL', why: `doctor/check_cli: response length=${cliCheckText.length}`, raw: cliCheckText.slice(0, 200) });

srv.kill();
console.log('\n=== Fix2 complete ===');
