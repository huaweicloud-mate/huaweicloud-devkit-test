// D2-4 每日测试探针（真实执行，SUT=hdk gitHead 681895da (v1.1.8-next.2)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-10-120.46.222.180/Linux/evidence/D2-4/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261010050953';
const META = { case: 'D2-4', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 681895da (v1.1.8-next.2)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-4 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const { redactSecrets } = await _m('safety-policy.mjs');
  let raw; try { raw = await redactSecrets(...["{\"ak\": \"AKID123456\", \"sk\": \"secret789\", \"token\": \"TOKEN123\"}"]); } catch(e) { raw = 'THROW:' + String(e).slice(0,80); }
  const actual = typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
  const pass = !(actual.includes("AKID123456"));
  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0,120) };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
