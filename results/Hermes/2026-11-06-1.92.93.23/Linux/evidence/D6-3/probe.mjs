// D6-3 每日测试探针（真实执行，SUT=hdk gitHead 8a6d8be2 (v1.1.13)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const OUT = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-11-06-1.92.93.23/Linux/evidence/D6-3/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
const META = { case: 'D6-3', assistant: 'Hermes(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 8a6d8be2 (v1.1.13)' };
function finish(r) { const o = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(o, null, 2), 'utf8'); console.log('D6-3 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }
async function run() {
  const server = SRC + '/mcp-server.mjs';
  const input = JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1.0'}}}) + '\n' + JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list',params:{}}) + '\n';
  const t0 = Date.now();
  const r = spawnSync('node', [server], { input, encoding: 'utf8', timeout: 30000 });
  const ms = Date.now() - t0;
  const out = (r.stdout || '') + (r.stderr || '');
  const actual = 'coldStartMs=' + ms + ' toolsList=' + (out.includes('tools') ? 'ok' : 'miss');
  const pass = out.includes('tools') && ms < 20000;
  return { status: pass ? 'PASS' : 'FAIL', actual };

}
run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
