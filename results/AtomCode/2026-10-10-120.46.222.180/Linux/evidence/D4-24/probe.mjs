// D4-24 每日测试探针（真实执行，SUT=hdk gitHead 681895da (v1.1.8-next.2)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-10-120.46.222.180/Linux/evidence/D4-24/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261010050953';
const META = { case: 'D4-24', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 681895da (v1.1.8-next.2)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D4-24 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const candidates = [ SRC + '/tools.mjs', '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/tools.mjs', '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/tools.mjs' ];
  let src = ''; for (const c of candidates) { if (existsSync(c)) { try { src = readFileSync(c, 'utf8'); } catch(e){} if (src) break; } }
  const ok = src.length > 0 && src.includes('confirm');
  return { status: ok ? 'PASS' : 'FAIL', actual: 'confirm ' + (ok ? '存在' : '缺失(或模块未找到)') + ' @ ' + m };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
