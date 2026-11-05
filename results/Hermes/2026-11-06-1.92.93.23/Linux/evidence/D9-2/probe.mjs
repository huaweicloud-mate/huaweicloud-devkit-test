// D9-2 每日测试探针（真实执行，SUT=hdk gitHead 8a6d8be2 (v1.1.13)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk';
const OUT = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-11-06-1.92.93.23/Linux/evidence/D9-2/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
const META = { case: 'D9-2', assistant: 'Hermes(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 8a6d8be2 (v1.1.13)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D9-2 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const server = SRC + '/mcp-server.mjs';
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
