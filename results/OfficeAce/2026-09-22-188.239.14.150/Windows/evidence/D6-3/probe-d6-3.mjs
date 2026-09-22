// AI生成
/**
 * D6-3: 大量工具列表性能
 * 测量大量工具列表的序列化和传输性能
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

console.log('=== D6-3: 大量工具列表性能 ===');

const nodePath = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node.exe';
const devkitRoot = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node_modules\\huaweicloud-devkit';
const mcpServerPath = join(devkitRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const env = { ...process.env, PATH: 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node;' + (process.env.PATH || '') };

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

const child = spawn(nodePath, [mcpServerPath], { stdio: ['pipe', 'pipe', 'pipe'], env });

try {
  // Initialize
  await mcpCall(child, {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd6-3', version: '1.0.0' } }
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  // T1: 工具数量
  const listResp = await mcpCall(child, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const tools = listResp?.result?.tools || [];
  check('T1.1 工具列表非空', tools.length > 0, `${tools.length} tools`);
  check('T1.2 工具数量 >= 30', tools.length >= 30, `${tools.length} tools`);

  // T2: 每个工具都有必要的字段
  let validTools = 0;
  let invalidToolNames = [];
  for (const tool of tools) {
    if (tool.name && tool.description && tool.inputSchema) {
      validTools++;
    } else {
      invalidToolNames.push(tool.name || 'unnamed');
    }
  }
  check('T2.1 所有工具有 name+description+inputSchema', invalidToolNames.length === 0, 
    `${validTools}/${tools.length} valid${invalidToolNames.length ? ', invalid: ' + invalidToolNames.join(',') : ''}`);

  // T3: 序列化大小
  const serialized = JSON.stringify(listResp.result);
  const sizeKB = serialized.length / 1024;
  check('T3.1 序列化大小 < 100KB', sizeKB < 100, `${sizeKB.toFixed(1)}KB`);
  check('T3.2 序列化大小 > 1KB', sizeKB > 1, `${sizeKB.toFixed(1)}KB`);

  // T4: 多次调用 tools/list 性能稳定
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await mcpCall(child, { jsonrpc: '2.0', id: 100 + i, method: 'tools/list', params: {} });
    times.push(performance.now() - start);
  }
  const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
  const maxMs = Math.max(...times);
  const minMs = Math.min(...times);
  const jitter = maxMs - minMs;
  check('T4.1 5次调用平均 < 500ms', avgMs < 500, `avg: ${avgMs.toFixed(1)}ms`);
  check('T4.2 抖动 < 500ms', jitter < 500, `jitter: ${jitter.toFixed(1)}ms (min: ${minMs.toFixed(0)}, max: ${maxMs.toFixed(0)})`);

  // T5: 工具名称唯一性
  const names = tools.map(t => t.name);
  const uniqueNames = new Set(names);
  check('T5.1 工具名称唯一', names.length === uniqueNames.size, `${uniqueNames.size} unique / ${names.length} total`);

  // T6: 工具名称符合命名规范
  let wellNamed = 0;
  for (const name of names) {
    if (/^[a-z][a-z0-9_]*$/.test(name)) wellNamed++;
  }
  check('T6.1 工具名称符合 snake_case', wellNamed === names.length, `${wellNamed}/${names.length}`);

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
console.log(JSON.stringify({ testCase: 'D6-3', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
