// probe-sandbox-tools.mjs — sandbox 执行层探路（确定性，不调 LLM）：列 sandbox 类 MCP 工具 + 试调最小参数
// 目的：把「sandbox 执行层未测」变成「有哪些工具 / 前置是什么 / 能否零成本只读探测」的实证结论
// 用法: node l2/probe-sandbox-tools.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.env.BENCH_MCP_SERVER || 'C:/Users/Administrator/.dsh/huaweicloud-plugins/src/mcp-server.mjs';

function detectVersion() {
  try {
    let dir = dirname(serverPath);
    for (let i = 0; i < 6; i++) {
      const p = join(dir, 'package.json');
      if (existsSync(p)) { try { const k = JSON.parse(readFileSync(p, 'utf-8')); if (k.name === 'huaweicloud-devkit') return `${k.name}@${k.version}`; } catch { } }
      const up = dirname(dir); if (up === dir) break; dir = up;
    }
  } catch { }
  return 'unknown';
}

const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
let buf = Buffer.alloc(0);
const pending = new Map();
let _id = 1;
const send = (o) => { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); };
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  for (;;) {
    const h = buf.indexOf('\r\n\r\n'); if (h < 0) return;
    const len = Number(/(?:^|\r\n)Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString())?.[1] || 0);
    const body = buf.slice(h + 4, h + 4 + len); if (body.length < len) return;
    buf = buf.slice(h + 4 + len);
    try { const o = JSON.parse(body.toString()); if (o.id && pending.has(o.id)) { pending.get(o.id)(o); pending.delete(o.id); } } catch { }
  }
});

await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
const tl = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/list', params: {} });
const tools = (tl.result?.tools || []).map((t) => t.name);
const sandbox = tools.filter((n) => /sandbox|devstation|terminal|workspace/i.test(n));
console.log(`工具总数 = ${tools.length}；sandbox/终端相关 = ${sandbox.length}`);
console.log('  相关工具:', sandbox.join(', ') || '无');

const trials = [];
for (const name of sandbox) {
  const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: {} } });
  const txt = ((r.result?.content || []).filter((x) => x.type === 'text').map((x) => x.text).join(' ') || JSON.stringify(r.error || {})).slice(0, 200);
  const isErr = !!r.error || /error|invalid|required|missing|not\s+found|权限|失败/i.test(txt);
  trials.push({ tool: name, callable: !isErr, sample: txt });
  console.log(`  ${name.padEnd(38)} ${isErr ? '需参数/前置' : '可调通'}  ← ${txt.slice(0, 90).replace(/\s+/g, ' ')}`);
}

const outDir = join(__dirname, 'results');
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const v = detectVersion();
writeFileSync(join(outDir, `sandbox-probe-${ts}-${String(v).replace(/[^0-9A-Za-z.-]/g, '_')}.json`),
  JSON.stringify({ meta: { ts, mode: 'sandbox-tool-probe', mcpServer: serverPath, devkitVersion: v, toolTotal: tools.length, sandboxTools: sandbox }, trials }, null, 2), 'utf-8');
console.log(`被测版本=${v}`);
console.log(`结果落盘: l2/results/sandbox-probe-${ts}.json`);
child.kill();