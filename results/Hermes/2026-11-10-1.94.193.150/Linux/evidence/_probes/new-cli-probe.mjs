import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 400) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}
const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';

console.log('=====CASE D1-69=====');
{
  const run = (args) => {
    try { return { code: 0, out: execFileSync('huaweicloud-devkit', args, { encoding: 'utf8', timeout: 60000 }) }; }
    catch (e) { return { code: e.status ?? -1, out: (e.stdout || '') + (e.stderr || '') }; }
  };
  for (const args of [['--help'], ['help']]) {
    const r = run(args);
    const first = (r.out || '').split('\n').filter((l) => l.trim()).slice(0, 12).join('\n');
    console.log(`huaweicloud-devkit ${args.join(' ')} -> exit=${r.code} 输出${r.out.length}字节`);
    console.log(first);
    check(`help 子命令退出码 0 且非空: ${args.join(' ')}`, r.code === 0 && r.out.trim().length > 30 && !/TODO/.test(r.out), `exit=${r.code} len=${r.out.length}`);
  }
  // 源码级：setup-cli.mjs 'help' case
  const sc = readFileSync(SRC + '/setup-cli.mjs', 'utf8');
  const helpCase = sc.split('\n').map((l) => l.trim()).find((l) => l === "case 'help':");
  console.log("setup-cli.mjs 'help' case 存在: " + !!helpCase);
  check("setup-cli.mjs case 'help'", !!helpCase, helpCase || '');
}
console.log('=====END D1-69=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));