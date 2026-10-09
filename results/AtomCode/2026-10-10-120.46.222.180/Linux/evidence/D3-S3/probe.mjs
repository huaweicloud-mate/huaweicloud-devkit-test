// D3-S3 每日测试探针（真实执行，SUT=hdk gitHead 681895da (v1.1.8-next.2)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-10-120.46.222.180/Linux/evidence/D3-S3/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261010050953';
const META = { case: 'D3-S3', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 681895da (v1.1.8-next.2)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D3-S3 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const { callTool } = await _m('tools.mjs');
  const r = await callTool('huaweicloud_service_catalog', { intent: "\u90e8\u7f72\u5f53\u524d\u9879\u76ee\u5230\u6c99\u7bb1\u7ed9\u6211\u9884\u89c8\u94fe\u63a5" });
  const svcs = Array.isArray(r?.recommendedServices) ? r.recommendedServices.map(String) : [];
  const actual = svcs.join(', ');
  const pass = !(actual.includes("Run hcloud --help"));
  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0,160) };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
