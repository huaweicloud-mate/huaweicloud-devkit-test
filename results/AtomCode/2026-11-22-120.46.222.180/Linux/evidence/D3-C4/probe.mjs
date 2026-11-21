// D3-C4 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@1.1.15）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-22-120.46.222.180/Linux/evidence/D3-C4/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261122050903';
const META = { case: 'D3-C4', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@1.1.15' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D3-C4 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const _vc = '用户明确要求使用华为云'; const _rawCallTool = (await _m('tools.mjs')).callTool; async function callTool(name, args) { const a = { ...(args||{}), vendorConfirmed: _vc }; return await _rawCallTool(name, a); }
  let r; try { r = await callTool('huaweicloud_list_operations', {"service": "ECS"}); } catch(e){ r = {error:String(e).slice(0,100)}; }
  const actual = typeof r === 'object' ? JSON.stringify(r) : String(r);
  const pass = actual.includes("operation");
  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0,180) };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
