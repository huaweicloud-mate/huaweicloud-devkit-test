// DSH/Linux daily probe — performance + protocol-negotiation (D6-1/D6-3/D6-4/D9-7)
import { spawnSync, spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { dispatch } = await import(CORE + '/mcp-protocol.mjs');
const { callTool } = await import(CORE + '/tools.mjs');
const results = [];
function check(id, name, pass, actual) { results.push({ id, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) }); }

// ---- D6-1 检索响应延迟 p95 < 2s (in-process retrieve_skill 连续采样) ----
{
  const samples = [];
  for (let i = 0; i < 30; i++) {
    const t0 = performance.now();
    await callTool('huaweicloud_retrieve_skill', { name: 'huawei-ecs' });
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  check('D6-1', 'retrieve_skill p95 < 2000ms', p95 < 2000, `p95=${p95.toFixed(1)}ms n=${samples.length}`);
}

// ---- D6-3 MCP 冷启动 < 5s (spawn mcp-server.mjs, time to tools/list ready) ----
{
  const t0 = performance.now();
  const child = spawn(process.execPath, ['/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs'], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = '';
  let ready = false;
  const deadline = performance.now() + 9000;
  child.stdout.on('data', (d) => { buf += d.toString(); });
  // speak JSON-RPC over stdio: initialize then tools/list
  const send = (m) => child.stdin.write(JSON.stringify(m) + '\n');
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  while (performance.now() < deadline && !ready) {
    if (!buf.includes('initialize')) { send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', clientInfo: { name: 'dsh', version: '1' } } }); await wait(150); }
    else if (!buf.includes('tools/list')) { send({ jsonrpc: '2.0', id: 2, method: 'notifications/initialized', params: {} }); send({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} }); await wait(150); }
    if (/result|tools/.test(buf) && buf.includes('huaweicloud')) ready = true;
    await wait(50);
  }
  try { child.kill(); } catch {}
  const coldMs = performance.now() - t0;
  check('D6-3', 'MCP cold start to tools/list visible < 5000ms', ready && coldMs < 5000, `ready=${ready} cold=${coldMs.toFixed(0)}ms`);
}

// ---- D6-4 并发 30 请求无死锁/错序 ----
{
  const jobs = [];
  for (let i = 0; i < 30; i++) {
    jobs.push(dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: 'perf-probe' }).then(r => ({ i, ok: Array.isArray(r.content) })).catch(e => ({ i, ok: false, err: e.message })));
  }
  const all = await Promise.race([Promise.all(jobs), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))]);
  const good = all.filter(r => r.ok).length;
  check('D6-4', '30 并发 tools/call 全部正常返回', all.length === 30 && good === 30, `${good}/${all.length}`);
}

// ---- D9-7 协议版本协商降级 (老版本 initialize 不挂死/明确报错) ----
{
  let negotiated = true, hang = false, detail = '';
  try {
    const r = await Promise.race([
      dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'old-client', version: '0.1' } }, { sessionId: 'd9-7' }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('hang')), 5000)),
    ]);
    detail = JSON.stringify(r.serverInfo || r).slice(0, 80);
    negotiated = !!r.serverInfo;
  } catch (e) { detail = 'err:' + e.message; negotiated = false; }
  check('D9-7', '老版本 initialize 正常协商或明确报错(不挂死)', negotiated, detail);
}

const failed = results.filter(r => !r.pass);
console.log('=== PERF/NEGOTIATE PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if (failed.length) { console.log('--- FAILED ---'); for (const r of failed) console.log(`  ${r.id} ${r.name} => ${r.actual}`); }