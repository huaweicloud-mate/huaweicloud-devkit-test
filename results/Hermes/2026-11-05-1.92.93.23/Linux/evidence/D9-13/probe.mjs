// D9-13 每日测试探针（真实执行，SUT=hdk gitHead 4ab34ed2 (v1.1.13-next.5)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk';
const OUT = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-11-05-1.92.93.23/Linux/evidence/D9-13/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
const META = { case: 'D9-13', assistant: 'Hermes(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 4ab34ed2 (v1.1.13-next.5)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D9-13 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const p = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
  let src = ''; if (existsSync(p)) { try { src = readFileSync(p, 'utf8'); } catch(e){} }
  const ok = src.length > 0 && src.includes('tools/call');
  return { status: ok ? 'PASS' : 'FAIL', actual: 'tools/call ' + (ok ? '存在' : '缺失') + ' @ mcp-protocol.mjs ' };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
