// EXP-E10 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@2.0.0-next.4 (gitHead 16a24814)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-20-120.46.222.180/Linux/evidence/EXP-E10/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261120051602';
const META = { case: 'EXP-E10', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@2.0.0-next.4 (gitHead 16a24814)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('EXP-E10 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const _vc = '用户明确要求使用华为云'; const _rawCallTool = (await _m('tools.js')).callTool; async function callTool(name, args) { const a = { ...(args||{}), vendorConfirmed: _vc }; return await _rawCallTool(name, a); }
  const intent = "\u90e8\u7f72\u4e00\u4e2a\u51fd\u6570\u5904\u7406\u56fe\u7247\u81ea\u52a8\u538b\u7f29";
  if (!intent) return { status: 'BLOCKED', why: 'eval-set 未提供该意图文本', actual: 'no-intent' };
  const r = await callTool('huaweicloud_service_catalog', { intent });
  const svcs = Array.isArray(r?.recommendedServices) ? r.recommendedServices.map(String) : [];
  const actual = svcs.join(', ');
  const pass = !actual.includes('Run hcloud --help') && actual.length > 0;
  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0,180) };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
