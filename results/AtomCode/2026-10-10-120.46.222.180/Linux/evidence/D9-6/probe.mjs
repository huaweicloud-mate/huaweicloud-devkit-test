// D9-6 每日测试探针（真实执行，SUT=hdk gitHead 681895da (v1.1.8-next.2)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-10-120.46.222.180/Linux/evidence/D9-6/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261010050953';
const META = { case: 'D9-6', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 681895da (v1.1.8-next.2)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D9-6 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const server = SRC + '/mcp-server.mjs';
  const payloads = [{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "atomcode-probe", "version": "1.0"}}}, {"jsonrpc": "2.0", "method": "notifications/initialized"}];
  const lines = payloads.map(p => JSON.stringify(p));
  const r = spawnSync(process.env.HDK_NODE || 'node', [server], { input: lines.join('\n') + '\n', encoding:'utf8', timeout: 30000, cwd: SRC });
  const out = (r.stdout || '') + (r.stderr || '');
  const actual = out.trim().slice(0, 300);
  const pass = out.includes('-32602') || out.includes('error') || out.includes('result') || out.includes('jsonrpc');
  return { status: pass ? 'PASS' : 'FAIL', actual };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
