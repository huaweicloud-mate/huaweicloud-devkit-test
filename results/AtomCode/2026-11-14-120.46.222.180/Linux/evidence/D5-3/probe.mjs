// D5-3 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@1.1.14-next.5 (gitHead 4fb59d76)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-14-120.46.222.180/Linux/evidence/D5-3/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261114054358';
const META = { case: 'D5-3', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@1.1.14-next.5 (gitHead 4fb59d76)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D5-3 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const { TOOL_DEFINITIONS } = await _m('tools.mjs');
  const actual = 'TOOL_DEFINITIONS.length=' + (Array.isArray(TOOL_DEFINITIONS) ? TOOL_DEFINITIONS.length : -1);
  const pass = Array.isArray(TOOL_DEFINITIONS) && TOOL_DEFINITIONS.length >= 30;
  return { status: pass ? 'PASS' : 'FAIL', actual };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
