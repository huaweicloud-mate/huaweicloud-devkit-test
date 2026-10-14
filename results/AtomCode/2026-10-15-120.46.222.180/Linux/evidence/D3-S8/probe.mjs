// D3-S8 每日测试探针（真实执行，SUT=hdk gitHead 6302921c (v1.1.9-next.0)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-15-120.46.222.180/Linux/evidence/D3-S8/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261015050600';
const META = { case: 'D3-S8', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 6302921c (v1.1.9-next.0)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D3-S8 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const { callTool } = await _m('tools.mjs');
  let r; try { r = await callTool('huaweicloud_explain_error', {"service": "APIGW", "errorCode": "APIGW.0301", "message": "Incorrect IAM authentication"}); } catch(e){ r = {error:String(e).slice(0,100)}; }
  const actual = typeof r === 'object' ? JSON.stringify(r) : String(r);
  const pass = actual.includes("KeystoneListProjects");
  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0,180) };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
