// D4-13 每日测试探针（真实执行，SUT=hdk gitHead 681895da (v1.1.8-next.2)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-10-120.46.222.180/Linux/evidence/D4-13/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261010053438';
const META = { case: 'D4-13', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 681895da (v1.1.8-next.2)' };
function finish(r) { const o = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(o, null, 2), 'utf8'); console.log('D4-13 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }
async function run() {
  const fs = await import('node:fs');
  const p = process.env.HOME + '/.config/huaweicloud/credentials.readonly.json';
  if (!existsSync(p)) return { status: 'BLOCKED', why: '缺 credentials.readonly.json', actual: 'no-readonly' };
  const ro = JSON.parse(readFileSync(p, 'utf8'));
  process.env.HW_ACCESS_KEY = ro.ak; process.env.HW_SECRET_KEY = ro.sk; delete process.env.HW_SECURITY_TOKEN;
  const { resolveCredentials } = await _m('auth/credentials.mjs');
  let actual, pass = false;
  try { const r = await resolveCredentials({}); const ak = r?.accessKey || r?.ak || ''; actual = 'resolvedAK=' + String(ak).slice(0,6) + '...'; pass = ak === ro.ak; } catch(e){ actual = 'THROW:'+String(e).slice(0,100); }
  return { status: pass ? 'PASS' : 'FAIL', actual };

}
run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
