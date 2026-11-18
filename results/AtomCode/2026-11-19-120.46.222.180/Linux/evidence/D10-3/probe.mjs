// D10-3 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@2.0.0-next.4 (gitHead 16a24814)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-19-120.46.222.180/Linux/evidence/D10-3/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261119061546';
const META = { case: 'D10-3', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@2.0.0-next.4 (gitHead 16a24814)' };
function finish(r) { const o = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(o, null, 2), 'utf8'); console.log('D10-3 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }
async function run() {
  const harness = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-19-120.46.222.180/Linux/evidence/D10-3/run-eval-local.mjs';
  const csv = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/eval/prompts/eval-set-v1.csv';
  const server = SRC + '/mcp-server.js';
  const r = spawnSync('node', [harness, server, csv], { encoding: 'utf8', timeout: 60000, env: { ...process.env, HUAWEICLOUD_VENDOR_CHALLENGE: 'off' } });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/HIT=(\d+) MISS=(\d+) N\/A=(\d+)/);
  const actual = (m ? ('HIT=' + m[1] + ' MISS=' + m[2] + ' N/A=' + m[3]) : 'no-verdict');
  const hit = m ? Number(m[1]) : 0; const miss = m ? Number(m[2]) : 99;
  const denom = hit + miss;
  const acc = denom ? (hit / denom * 100) : 0;
  const pass = m && denom >= 10 && acc >= 50;
  return { status: pass ? 'PASS' : 'FAIL', actual: actual + ' acc=' + acc.toFixed(1) + '%' };

}
run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
