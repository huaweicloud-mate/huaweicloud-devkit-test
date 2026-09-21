// AI生成
/**
 * D6-9: 内存占用
 * 测试 MCP server 进程内存占用
 */
import { join } from 'node:path';
import { spawn, execSync } from 'node:child_process';

const results = [];
let overallPass = true;

function check(label, condition, detail) {
  const pass = Boolean(condition);
  if (!pass) overallPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' :: ' + detail : ''}`);
}

console.log('=== D6-9: 内存占用 ===');

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

// T1: 启动后内存占用
const child = spawn(nodePath, [mcpServerPath], { stdio: ['pipe', 'pipe', 'pipe'], env });

// Wait for process to start
await new Promise(r => setTimeout(r, 1000));

function getProcessMemory(pid) {
  try {
    // Use PowerShell Get-Process for reliable memory reading on Windows
    const out = execSync(`powershell -NoProfile -Command "(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).WorkingSet64"`, { encoding: 'utf8', timeout: 5000 });
    const bytes = parseInt(out.trim());
    if (bytes > 0) return bytes / 1024 / 1024; // MB
  } catch {}
  return null;
}

try {
  const pid = child.pid;
  
  // Initialize
  await mcpCall(child, {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd6-9', version: '1.0.0' } }
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  // T1: 启动后内存
  await new Promise(r => setTimeout(r, 500));
  const memAfterInit = getProcessMemory(pid);
  check('T1.1 启动后内存可读取', memAfterInit !== null, `${memAfterInit?.toFixed(1)}MB`);
  check('T1.2 启动后内存 < 200MB', memAfterInit !== null && memAfterInit < 200, `${memAfterInit?.toFixed(1)}MB`);

  // T2: 执行 tools/list 后内存
  await mcpCall(child, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  await new Promise(r => setTimeout(r, 200));
  const memAfterList = getProcessMemory(pid);
  check('T2.1 tools/list 后内存 < 200MB', memAfterList !== null && memAfterList < 200, `${memAfterList?.toFixed(1)}MB`);

  // T3: 执行 10 次 auth_status 后内存
  for (let i = 0; i < 10; i++) {
    await mcpCall(child, {
      jsonrpc: '2.0', id: 100 + i, method: 'tools/call',
      params: { name: 'huaweicloud_auth_status', arguments: {} }
    });
  }
  await new Promise(r => setTimeout(r, 200));
  const memAfterCalls = getProcessMemory(pid);
  check('T3.1 10次调用后内存 < 200MB', memAfterCalls !== null && memAfterCalls < 200, `${memAfterCalls?.toFixed(1)}MB`);

  // T4: 内存增长 (调用前后差值)
  const memGrowth = (memAfterCalls || 0) - (memAfterInit || 0);
  check('T4.1 内存增长 < 50MB', Math.abs(memGrowth) < 50, `growth: ${memGrowth.toFixed(1)}MB`);

  // T5: Node.js 内置内存信息
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const rssMB = memUsage.rss / 1024 / 1024;
  check('T5.1 探针进程 RSS < 200MB', rssMB < 200, `rss: ${rssMB.toFixed(1)}MB`);
  check('T5.2 探针进程 heap < 100MB', heapUsedMB < 100, `heap: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB`);

  // T6: 强制 GC 后内存 (如果可用)
  if (global.gc) {
    global.gc();
    await new Promise(r => setTimeout(r, 200));
    const memAfterGC = getProcessMemory(pid);
    check('T6.1 GC 后内存 < 200MB', memAfterGC !== null && memAfterGC < 200, `${memAfterGC?.toFixed(1)}MB`);
  } else {
    check('T6.1 GC 不可用 (跳过)', true, 'no --expose-gc flag');
  }

} catch(e) {
  check('T1.1 测试执行成功', false, e.message);
} finally {
  child.kill();
}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D6-9', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
