// D4-4 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-13-120.46.222.180/Linux/evidence/D4-4/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261113060346';
const META = { case: 'D4-4', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D4-4 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const { classifyHcloudArgs } = await _m('safety-policy.js');
  let r; try { r = classifyHcloudArgs(...[["ECS", "DeleteServers", "--delete-all"]]); } catch(e) { r = { decision:'THROW:'+String(e).slice(0,60), isWrite:false }; }
  const actual = (r.decision||'') + '/' + (r.isWrite?'write':'read-only');
  const pass = r.decision==='confirm' || r.decision==='deny' || r.isWrite===true;
  return { status: pass ? 'PASS' : 'FAIL', actual };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
