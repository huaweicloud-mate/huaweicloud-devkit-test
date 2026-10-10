// 最后补测: D3-B5 detect_framework / D6-1 检索延迟 / D6-4 并发 / D9-5 stdio / D10-4 高危干预 / D3-C5 冒烟
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SERVER = process.env.HDK_MCP_SERVER;
const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;

const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
const re = await import(`file://${HDK}/src/risk-rule-engine.mjs`);

function writeEv(id, status, expected, actual, detail) {
  mkdirSync(join(EVID, id), { recursive: true });
  writeFileSync(join(EVID, id, 'stdout.txt'),
    `=== CASE ${id} ===  ${status}\n  expected: ${expected}\n  actual:   ${actual}\n  detail:   ${detail || ''}\n`, 'utf-8');
  console.log(`${status.padEnd(6)} ${id}  ${actual.slice(0,110)}`);
}

function spawnServer() {
  const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'ignore'] });
  let buf = ''; const pending = new Map(); let nextId = 1;
  child.stdout.on('data', (d) => {
    buf += d.toString('utf8'); let i;
    while ((i = buf.indexOf('\n')) !== -1) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!l) continue; let m; try { m = JSON.parse(l); } catch { continue; } if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } }
  });
  return {
    child,
    rpc(method, params) { return new Promise((r) => { const id = nextId++; pending.set(id, r); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n'); }); },
  };
}

const srv = spawnServer();
await srv.rpc('initialize', { protocolVersion: '2024-11-05' });

// D3-B5 detect_framework
{
  const tmp = '/tmp/hdk-probe-next-' + Date.now();
  mkdirSync(tmp, { recursive: true });
  writeFileSync(join(tmp, 'next.config.js'), 'module.exports={};');
  writeFileSync(join(tmp, 'package.json'), '{"dependencies":{"next":"14.0.0"}}');
  const r = await srv.rpc('tools/call', { name: 'huaweicloud_detect_framework', arguments: { projectPath: tmp } });
  let o = {};
  if (r.error) { o = { _error: r.error.code + ' ' + (r.error.message || '') }; }
  else try { o = JSON.parse(r.result.content[0].text); } catch { o = { raw: (r.result && r.result.content && r.result.content[0] && r.result.content[0].text) || '' }; }
  const ok = (o.framework || '').toLowerCase().includes('next');
  writeEv('D3-B5', ok ? 'PASS' : 'FAIL', 'detect_framework 识别 Next.js 项目', `framework=${o.framework}, type=${o.type}`, '');
  rmSync(tmp, { recursive: true, force: true });
}
// D6-1 retrieve_skill 延迟
{
  const t0 = Date.now();
  const r = await srv.rpc('tools/call', { name: 'huaweicloud_retrieve_skill', arguments: { name: 'huaweicloud-core' } });
  const dt = Date.now() - t0;
  let o = {};
  try { o = JSON.parse(r.result.content[0].text); } catch { o = { raw: String(r.result.content[0].text).slice(0,80) }; }
  writeEv('D6-1', (dt < 2000 && o.ok) ? 'PASS' : 'FAIL', 'skill 检索延迟 <2000ms 且返回成功', `${dt}ms, ok=${o.ok}`, '');
}
// D6-4 并发 dispatch
{
  const t0 = Date.now();
  const rs = await Promise.all([
    srv.rpc('tools/call', { name: 'huaweicloud_service_catalog', arguments: { intent: 'ecs' } }),
    srv.rpc('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }),
    srv.rpc('tools/call', { name: 'huaweicloud_get_regional_availability', arguments: { service: 'ecs', region: 'cn-north-4' } }),
  ]);
  const ok = rs.every(r => r.result && Array.isArray(r.result.content) && r.result.content[0] && r.result.content[0].type === 'text');
  writeEv('D6-4', ok ? 'PASS' : 'FAIL', '并发 3 个 tools/call 均返回 content 结构', `3 并发 content 正确=${ok}, ${Date.now()-t0}ms`, '');
}
// D9-5 stdio 健壮 (30 并发)
{
  const reqs = Array.from({ length: 30 }, (_, i) => srv.rpc('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }));
  const rs = await Promise.all(reqs);
  const ok = rs.every(r => r.result && r.result.content && !r.error);
  writeEv('D9-5', ok ? 'PASS' : 'FAIL', 'stdio 30 并发全部正确响应', `30/30 正确=${ok}`, '');
}
// D10-4 高危干预 (5 类)
{
  const five = [
    sp.classifyTextCommand('hcloud ECS DeleteServers --id i').decision,
    sp.classifyTextCommand('cat ~/.hcloud/config.json').decision,
    sp.classifyTextCommand('env | grep HUAWEICLOUD_ACCESS_KEY').decision,
    sp.classifyTextCommand('hcloud CSMS ShowSecretVersion --secret-name x').decision,
    re.evaluateCommandRisk('rm -rf /').decision,
  ];
  const ok = five.every(d => d === 'deny');
  writeEv('D10-4', ok ? 'PASS' : 'FAIL', '5 类高危命令全部 deny', `${five.join('/')} => ${ok ? '全部拦截' : '有漏网'}`, '');
}
// D3-C5 五工具冒烟
{
  const tools = ['huaweicloud_list_regions','huaweicloud_service_catalog','huaweicloud_auth_status','huaweicloud_hook_check_command','huaweicloud_plan_cli_command'];
  const args = [{},{intent:'ecs'},{},{command:'hcloud ecs DeleteServer'},{args:['ecs','ListServersDetails']}];
  let ok = 0;
  for (let i = 0; i < tools.length; i++) {
    const r = await srv.rpc('tools/call', { name: tools[i], arguments: args[i] });
    if (r.result && r.result.content && !r.error) ok++;
  }
  writeEv('D3-C5', ok === tools.length ? 'PASS' : 'FAIL', '5 工具冒烟全通', `${ok}/${tools.length} 冒烟通过`, '');
}

srv.child.stdin.end();
setTimeout(() => process.exit(0), 200);