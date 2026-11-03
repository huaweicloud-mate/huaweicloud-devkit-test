// D3-S2 每日测试探针（真实执行，SUT=hdk gitHead 7ad8a533 (v1.1.13-next.3)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk';
const OUT = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-11-04-1.92.93.23/Linux/evidence/D3-S2/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261103053252';
const META = { case: 'D3-S2', assistant: 'Hermes(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 7ad8a533 (v1.1.13-next.3)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D3-S2 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const { callTool } = await _m('tools.mjs');
  const r = await callTool('huaweicloud_service_catalog', { intent: "\u5220\u9664\u6d4b\u8bd5VPC\uff0c\u5148\u5217\u547d\u4ee4\u786e\u8ba4" });
  const svcs = Array.isArray(r?.recommendedServices) ? r.recommendedServices.map(String) : [];
  const actual = svcs.join(', ');
  const pass = !(actual.includes("Run hcloud --help"));
  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0,180) };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
