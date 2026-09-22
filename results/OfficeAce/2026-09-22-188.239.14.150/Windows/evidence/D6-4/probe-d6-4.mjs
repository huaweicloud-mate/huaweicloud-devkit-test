// AI生成
/**
 * D6-4: 并发请求处理
 * 测试 MCP server 并发处理多个工具调用
 */
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

console.log('=== D6-4: 并发请求处理 ===');

const nodePath = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node.exe';
const devkitRoot = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node_modules\\huaweicloud-devkit';
const mcpServerPath = join(devkitRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const env = { ...process.env, PATH: 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node;' + (process.env.PATH || '') };

function mcpCall(child, msg, timeoutMs = 15000) {
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

const child = spawn(nodePath, [mcpServerPath], { stdio: ['pipe', 'pipe', 'pipe'], env });

try {
  // Initialize
  await mcpCall(child, {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd6-4', version: '1.0.0' } }
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  // T1: 并发 5 个 auth_status 调用
  const concurrency = 5;
  const concurrentStart = performance.now();
  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(mcpCall(child, {
      jsonrpc: '2.0', id: 100 + i, method: 'tools/call',
      params: { name: 'huaweicloud_auth_status', arguments: {} }
    }));
  }
  const responses = await Promise.allSettled(promises);
  const concurrentMs = performance.now() - concurrentStart;

  const fulfilled = responses.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
  check('T1.1 并发5个 auth_status 全部成功', fulfilled === concurrency, `${fulfilled}/${concurrency} succeeded`);
  check('T1.2 并发5个总耗时 < 5000ms', concurrentMs < 5000, `${concurrentMs.toFixed(1)}ms`);

  // T2: 并发 10 个 tools/list 调用
  const concurrency2 = 10;
  const start2 = performance.now();
  const promises2 = [];
  for (let i = 0; i < concurrency2; i++) {
    promises2.push(mcpCall(child, { jsonrpc: '2.0', id: 200 + i, method: 'tools/list', params: {} }));
  }
  const responses2 = await Promise.allSettled(promises2);
  const ms2 = performance.now() - start2;
  const fulfilled2 = responses2.filter(r => r.status === 'fulfilled' && r.value?.result?.tools).length;
  check('T2.1 并发10个 tools/list 全部成功', fulfilled2 === concurrency2, `${fulfilled2}/${concurrency2} succeeded`);
  check('T2.2 并发10个总耗时 < 5000ms', ms2 < 5000, `${ms2.toFixed(1)}ms`);

  // T3: 混合并发 (auth_status + tools/list + show_profile)
  const mixStart = performance.now();
  const mixPromises = [];
  for (let i = 0; i < 3; i++) {
    mixPromises.push(mcpCall(child, { jsonrpc: '2.0', id: 300 + i, method: 'tools/call', params: { name: 'huaweicloud_auth_status', arguments: {} } }));
  }
  for (let i = 0; i < 3; i++) {
    mixPromises.push(mcpCall(child, { jsonrpc: '2.0', id: 310 + i, method: 'tools/list', params: {} }));
  }
  for (let i = 0; i < 2; i++) {
    mixPromises.push(mcpCall(child, { jsonrpc: '2.0', id: 320 + i, method: 'tools/call', params: { name: 'huaweicloud_show_profile_redacted', arguments: {} } }));
  }
  const mixResponses = await Promise.allSettled(mixPromises);
  const mixMs = performance.now() - mixStart;
  const mixFulfilled = mixResponses.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
  check('T3.1 混合并发8个全部成功', mixFulfilled === 8, `${mixFulfilled}/8 succeeded`);
  check('T3.2 混合并发总耗时 < 5000ms', mixMs < 5000, `${mixMs.toFixed(1)}ms`);

  // T4: 顺序 vs 并发性能对比 (same operation: auth_status)
  const seqStart = performance.now();
  for (let i = 0; i < 5; i++) {
    await mcpCall(child, { jsonrpc: '2.0', id: 400 + i, method: 'tools/call', params: { name: 'huaweicloud_auth_status', arguments: {} } });
  }
  const seqMs = performance.now() - seqStart;
  check('T4.1 并发不比顺序慢2倍以上', concurrentMs <= seqMs * 2, `concurrent5: ${concurrentMs.toFixed(0)}ms, sequential5: ${seqMs.toFixed(0)}ms`);

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
console.log(JSON.stringify({ testCase: 'D6-4', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
