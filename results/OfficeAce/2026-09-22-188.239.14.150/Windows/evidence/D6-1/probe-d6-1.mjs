// AI生成
/**
 * D6-1: MCP响应延迟
 * 测量 MCP tools/list 和单个工具调用的响应延迟
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const results = [];
let overallPass = true;

function check(label, condition, detail) {
  const pass = Boolean(condition);
  if (!pass) overallPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' :: ' + detail : ''}`);
}

console.log('=== D6-1: MCP响应延迟 ===');

const nodePath = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node.exe';
const devkitRoot = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node_modules\\huaweicloud-devkit';
const mcpServerPath = join(devkitRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const env = { ...process.env, PATH: 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node;' + (process.env.PATH || '') };

// Helper: send JSON-RPC message and wait for response
function mcpCall(child, msg, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const handler = (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === msg.id) {
            child.stdout.off('data', handler);
            resolve(parsed);
            return;
          }
        } catch {}
      }
    };
    child.stdout.on('data', handler);
    child.stdin.write(JSON.stringify(msg) + '\n');
    setTimeout(() => { child.stdout.off('data', handler); reject(new Error('timeout')); }, timeoutMs);
  });
}

// Start MCP server
const child = spawn(nodePath, [mcpServerPath], { stdio: ['pipe', 'pipe', 'pipe'], env });

try {
  // Initialize
  const initStart = performance.now();
  const initResp = await mcpCall(child, {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd6-1', version: '1.0.0' } }
  });
  const initMs = performance.now() - initStart;
  check('T1.1 MCP initialize 成功', !!initResp?.result, `result keys: ${Object.keys(initResp?.result || {}).join(',')}`);
  check('T1.2 initialize 延迟 < 3000ms', initMs < 3000, `${initMs.toFixed(1)}ms`);

  // Send initialized notification
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  // Measure tools/list latency (3 runs)
  const listTimes = [];
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    const resp = await mcpCall(child, { jsonrpc: '2.0', id: 100 + i, method: 'tools/list', params: {} });
    listTimes.push(performance.now() - start);
    if (i === 0) check('T2.1 tools/list 有响应', !!resp?.result?.tools, `${resp?.result?.tools?.length} tools`);
  }
  const avgListMs = listTimes.reduce((a, b) => a + b, 0) / listTimes.length;
  const maxListMs = Math.max(...listTimes);
  check('T2.2 tools/list 平均延迟 < 500ms', avgListMs < 500, `avg: ${avgListMs.toFixed(1)}ms, times: ${listTimes.map(t => t.toFixed(0)).join(', ')}`);
  check('T2.3 tools/list 最大延迟 < 1000ms', maxListMs < 1000, `max: ${maxListMs.toFixed(1)}ms`);

  // Measure auth_status call latency (3 runs)
  const callTimes = [];
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    const resp = await mcpCall(child, {
      jsonrpc: '2.0', id: 200 + i, method: 'tools/call',
      params: { name: 'huaweicloud_auth_status', arguments: {} }
    });
    callTimes.push(performance.now() - start);
    if (i === 0) check('T3.1 auth_status 有响应', !resp?.error, `ok`);
  }
  const avgCallMs = callTimes.reduce((a, b) => a + b, 0) / callTimes.length;
  const maxCallMs = Math.max(...callTimes);
  check('T3.2 auth_status 平均延迟 < 2000ms', avgCallMs < 2000, `avg: ${avgCallMs.toFixed(1)}ms, times: ${callTimes.map(t => t.toFixed(0)).join(', ')}`);
  check('T3.3 auth_status 最大延迟 < 5000ms', maxCallMs < 5000, `max: ${maxCallMs.toFixed(1)}ms`);

  // P95 latency (with only 3 samples, use max as p95 proxy)
  const p95 = maxListMs;
  check('T3.4 P95 延迟 < 1000ms', p95 < 1000, `p95: ${p95.toFixed(1)}ms`);

} catch(e) {
  check('T1.1 MCP 通信成功', false, e.message);
} finally {
  child.kill();
}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D6-1', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
