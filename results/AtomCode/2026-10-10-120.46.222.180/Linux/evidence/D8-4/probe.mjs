// D8-4 每日测试探针（真实执行，SUT=hdk gitHead 681895da (v1.1.8-next.2)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-10-120.46.222.180/Linux/evidence/D8-4/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261010052436';
const META = { case: 'D8-4', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 681895da (v1.1.8-next.2)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D8-4 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const dir = "/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/skills";
  const matcher = "SKILL.md";
  let count = 0, sampled = '';
  function walk(d) { let es; try { es = readdirSync(d); } catch(e){ return; } for (const e of es) { const p = d + '/' + e; let isDir = false; try { isDir = statSync(p).isDirectory(); } catch(err){} if (isDir) walk(p); else if (e.includes(matcher)) { count++; if (!sampled) sampled = e; } } }
  walk(dir);
  const actual = 'count=' + count + ' sample=' + sampled;
  const pass = count >= 7;
  return { status: pass ? 'PASS' : 'FAIL', actual };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
