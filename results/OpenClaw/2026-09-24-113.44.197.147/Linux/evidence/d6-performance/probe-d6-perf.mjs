// D6 性能探针 —— 冷启 / 检索延迟 / 并发调度
import { execFileSync, spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { dispatch } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { callTool } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, cond, note) {
  cond ? pass++ : fail++;
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${note}`);
}

// D6-3 MCP 冷启时间 <5s
{
  const MCP = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
  const init = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"p","version":"1"}}}\n';
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    execFileSync('node', [MCP], { input: init, stdio: ['pipe', 'ignore', 'ignore'] });
    samples.push(performance.now() - t0);
  }
  const p95 = samples.sort((a, b) => a - b)[4];
  check('D6-3', 'MCP 冷启 <5s', p95 < 5000, `p95=${p95.toFixed(0)}ms`);
}

// D6-1 检索响应延迟 p95<2s
{
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await callTool('huaweicloud_list_regions', {});
    samples.push(performance.now() - t0);
  }
  const p95 = samples.sort((a, b) => a - b)[4];
  check('D6-1', '检索响应延迟 p95<2s', p95 < 2000, `p95=${p95.toFixed(0)}ms`);
}

// D6-4 并发调度正确性
{
  const N = 30;
  const rs = await Promise.all(Array.from({ length: N }, (_, i) => dispatch('tools/list', {}, { sessionId: `s${i}` })));
  const ok = rs.every((r) => Array.isArray(r.tools) && r.tools.length === 40);
  check('D6-4', '30 并发无死锁无错乱', ok, `ok=${ok}`);
}

console.log('\n=== D6 性能探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);