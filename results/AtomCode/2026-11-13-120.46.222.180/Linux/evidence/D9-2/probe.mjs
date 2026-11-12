// D9-2 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-13-120.46.222.180/Linux/evidence/D9-2/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261113060346';
const META = { case: 'D9-2', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D9-2 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const server = SRC + '/mcp-server.js';
  const payloads = [{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "no_such_tool", "arguments": {}}}, {"jsonrpc": "2.0", "id": 2, "method": "bogus/method", "params": {}}, {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"arguments": {}}}];
  const expectCodes = ["-32602", "-32601"];
  const lines = payloads.map(p => JSON.stringify(p));
  const r = spawnSync('node', [server], { input: lines.join('\n') + '\n', encoding:'utf8', timeout: 30000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const actual = out.trim().slice(0, 400);
  const pass = expectCodes.some(c => out.includes(c));
  return { status: pass ? 'PASS' : 'FAIL', actual };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
