// D4-25 每日测试探针（真实执行，SUT=hdk gitHead 681895da (v1.1.8-next.2)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-10-120.46.222.180/Linux/evidence/D4-25/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261010052436';
const META = { case: 'D4-25', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead 681895da (v1.1.8-next.2)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D4-25 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const hook = CORE + '/hooks/huaweicloud-safety.py';
  const eventsPath = CORE + '/telemetry/hook-events.jsonl';
  const before = existsSync(eventsPath) ? readFileSync(eventsPath, 'utf8') : '';
  const payload = JSON.stringify({ tool_name: 'Bash', tool_input: { command: "hcloud ECS DeleteServers --delete-all --project-id x" } });
  const r = spawnSync('python3', [hook], { input: payload, encoding: 'utf8', timeout: 20000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const after = existsSync(eventsPath) ? readFileSync(eventsPath, 'utf8') : '';
  let key = '';
  const added = after.slice(before.length);
  for (const ln of added.split('\n')) { if (ln.includes('DeleteServers')) { try { key = JSON.parse(ln).key; } catch(e){} } }
  const actual = key || ('hook-exit:' + r.status + ' ' + out.trim().slice(0,60));
  const pass = key === 'cli:write';
  return { status: pass ? 'PASS' : 'FAIL', why: 'WRITE_OPERATION_RE=(^|[A-Za-z0-9]) 边界, 空格分隔写命令未命中→cli:invoke', actual };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
