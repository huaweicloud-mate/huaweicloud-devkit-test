// D3 功能工具冒烟 — Hermes / Linux / 1.1.4-next.3
import { spawn } from 'node:child_process';
const SERVER = process.env.HDK_MCP_SERVER;
const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = ''; const pending = new Map(); let nextId = 1;
function rpc(method, params) {
  return new Promise((r) => { const id = nextId++; pending.set(id, r); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n'); });
}
child.stdout.on('data', (d) => {
  buf += d.toString('utf8'); let i;
  while ((i = buf.indexOf('\n')) !== -1) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!l) continue; let m; try { m = JSON.parse(l); } catch { continue; } if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } }
});
async function call(name, args) {
  const r = await rpc('tools/call', { name, arguments: args });
  if (r.error) return { err: r.error.code + ' ' + (r.error.message || '').slice(0, 80) };
  try { return JSON.parse(r.result.content[0].text); } catch { return { raw: r.result.content[0].text }; }
}
function log(k, v) { console.log(k.padEnd(30), '->', JSON.stringify(v).slice(0, 220)); }

setTimeout(async () => {
  await rpc('initialize', { protocolVersion: '2024-11-05' });

  let r;
  r = await call('huaweicloud_list_regions', {}); log('D3-A5 list_regions', (r.regions || []).length + ' 区域');
  r = await call('huaweicloud_get_regional_availability', { service: 'ecs', region: 'cn-north-4' }); log('D3-A5 get_regional_avail', r);
  r = await call('huaweicloud_retrieve_skill', { name: 'huawei-ecs' }); log('D3-A1 retrieve_skill', { ok: r.ok, name: r.name, refs: (r.references || []).length });
  r = await call('huaweicloud_search_docs', { query: 'create obs bucket lifecycle' }); log('D3-A2/B6 search_docs', { total: r.total, top: (r.results && r.results[0] && r.results[0].title) });
  r = await call('huaweicloud_search_marketplace', { query: 'ECS' }); log('D3-A6 search_marketplace', { total: r.total });
  r = await call('huaweicloud_service_catalog', { intent: 'deploy app' }); log('D3-A3 service_catalog', { keys: Object.keys(r) });
  r = await call('huaweicloud_list_operations', { service: 'ecs' }); log('D3-B1 list_operations', { count: r.count, ok: r.ok });
  r = await call('huaweicloud_plan_cli_command', { args: ['ecs', 'ListFlavors'] }); log('D3-B2 plan', { ok: r.ok, classification: r.classification, decision: r.decision });
  r = await call('huaweicloud_explain_error', { code: 'Ecs.0005' }); log('D3-B4 explain_error', { ok: r.ok, hasSuggestion: !!r.suggestion, keys: Object.keys(r) });
  r = await call('huaweicloud_run_readonly_command', { args: ['ecs', 'ListServersDetails'] }); log('D3-B3 run_readonly(真云)', { err: r.err || r });
  r = await call('huaweicloud_hook_check_command', { command: 'hcloud ecs DeleteServer' }); log('D1-8 hook_check_command', { decision: r.decision, rules: (r.findings || []).length });
  r = await call('huaweicloud_auth_status', {}); log('D2-1 auth_status', { ok: r.ok, authenticated: r.authenticated, keys: Object.keys(r) });

  child.stdin.end(); setTimeout(() => process.exit(0), 200);
}, 4000);