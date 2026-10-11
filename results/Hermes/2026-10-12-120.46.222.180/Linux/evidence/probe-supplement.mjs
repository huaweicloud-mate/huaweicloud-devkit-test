// 补充探针: D6-3 MCP冷启动 / D10-2 英文skill激活率 / D9-9 tools/call 超时语义
import { spawn } from 'node:child_process';

const SERVER = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const rpc = (child, id, method, params) => new Promise((res) => {
  const h = (m) => { if (m.id === id) { child.stdout.off('data', parse); res(m); } };
  // 用简单 JSON-lines 帧(该 MCP 用 newline-delimited)
  child.pending.set(id, res);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n');
});

function parseNDJSON(str) { return str.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }

async function startServer() {
  const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'inherit'] });
  child.pending = new Map();
  let buf = '';
  child.stdout.on('data', (d) => {
    buf += d.toString('utf8');
    let i;
    while ((i = buf.indexOf('\n')) !== -1) {
      const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!l) continue;
      let m; try { m = JSON.parse(l); } catch { continue; }
      if (m.id && child.pending.has(m.id)) { child.pending.get(m.id)(m); child.pending.delete(m.id); }
    }
  });
  return child;
}

function call(child, method, params) {
  const id = Math.floor(Math.random() * 1e9);
  return new Promise((res) => {
    child.pending.set(id, res);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n');
  });
}

// ---- D6-3 冷启动计时 ----
{
  const t0 = Date.now();
  const child = await startServer();
  const r = await call(child, 'initialize', { protocolVersion: '2024-11-05' });
  const t1 = Date.now();
  await call(child, 'tools/list', {});
  const t2 = Date.now();
  console.log(`D6-3 initialize 延迟 = ${t1 - t0}ms, tools/list 就绪 = ${t2 - t0}ms`);
  console.log(`  initialize.serverInfo = ${JSON.stringify(r.result?.serverInfo || {})}`);
  child.kill();
  // 冷启动 < 2s 判 PASS(参考另一台机器 d6-3 阈值)
  console.log(`  ${(t2 - t0) < 2000 ? 'PASS' : 'FAIL'}  D6-3  MCP冷启时间 ${t2 - t0}ms (<2000ms)`);
}

// ---- D10-2 英文 skill 激活率 ----
{
  const child = await startServer();
  await call(child, 'initialize', { protocolVersion: '2024-11-05' });
  const cases = [
    ['create an ecs server', 'huawei-ecs'],
    ['how do i use the obs api', 'huawei-obs'],
    ['set up a vpc subnet', 'huawei-vpc'],
    ['rds mysql database', 'huawei-rds'],
  ];
  let hit = 0;
  for (const [intent, wantSkill] of cases) {
    const r = await call(child, 'tools/call', { name: 'huaweicloud_service_catalog', arguments: { intent } });
    let txt = '';
    try { txt = JSON.stringify(r.result?.content?.[0]?.text || r.result); } catch {}
    let recs = [];
    try { const obj = JSON.parse(r.result?.content?.[0]?.text || '{}'); recs = obj.recommendedSkills || []; } catch { try { recs = r.result?.recommendedSkills || r.result?.content ? (JSON.parse(r.result.content[0].text).recommendedSkills || []) : []; } catch { recs = []; } }
    const ok = recs.includes(wantSkill);
    if (ok) hit++;
    console.log(`  D10-2 "=${intent}" -> skills=${JSON.stringify(recs)} ${ok ? 'HIT' : 'MISS'} (期望 ${wantSkill})`);
  }
  console.log(`  ${hit === cases.length ? 'PASS' : (hit >= 2 ? 'PARTIAL' : 'FAIL')}  D10-2  英文skill激活率 ${hit}/${cases.length}`);
  child.kill();
}

// ---- D9-9 tools/call 超时(时钟) ----
{
  const child = await startServer();
  await call(child, 'initialize', { protocolVersion: '2024-11-05' });
  // 用 list_regions 传极短 timeoutMs, 观察是否受控超时返回(而非挂死)
  const t0 = Date.now();
  const r = await call(child, 'tools/call', { name: 'huaweicloud_list_regions', arguments: { timeoutMs: 1000 } });
  const dt = Date.now() - t0;
  console.log(`D9-9 list_regions(timeoutMs=1000) 返回耗时 ${dt}ms, 结果类型=${r.error ? 'error' : 'ok'}`);
  console.log(`  ${dt < 10000 ? 'PASS' : 'FAIL'}  D9-9  tools/call 超时受控返回(未挂死), ${dt}ms`);
  child.kill();
}
console.log('SUPPLEMENT DONE');