// D2-2 每日测试探针（真实执行，SUT=hdk gitHead 681895da (v1.1.8-next.2)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-10-120.46.222.180/Linux/evidence/D2-2/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261010053438';
const META = { case: 'D2-2', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 681895da (v1.1.8-next.2)' };
function finish(r) { const o = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(o, null, 2), 'utf8'); console.log('D2-2 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }
async function run() {
  const { getAuthStatus } = await _m('auth/service.mjs');
  let actual, pass = false;
  try { const r = await getAuthStatus('all'); actual = JSON.stringify(r).slice(0,160); pass = actual.length > 10; } catch(e){ actual = 'THROW:'+String(e).slice(0,100); }
  return { status: pass ? 'PASS' : 'FAIL', actual };

}
run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
