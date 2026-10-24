#!/usr/bin/env node
// D4-27 双路径输出脱敏缺口（--key value 空格形态）（OpenClaw Linux 2026-10-25 fresh 直调）
// 断言：key=value 与 --key value 两种形态均应脱敏。
import { pathToFileURL } from 'node:url';
const SRC = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { redactSecrets } = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);

const SECRET = 'AKIAIOSFODNN7EXAMPLE';
const cases = [
  ['eq-form', `--access-key=${SECRET}`],
  ['space-form', `--access-key ${SECRET}`],
];
const results = [];
for (const [label, input] of cases) {
  const out = redactSecrets(input);
  const leaked = out.includes(SECRET);
  const ok = !leaked;
  results.push({ label, input, output: out, leaked, ok });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${label}: leaked=${leaked}`);
  console.log(`    input =${input}`);
  console.log(`    output=${out}`);
}
const failed = results.filter((r) => !r.ok).map((r) => r.label);
console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({
  case: 'D4-27',
  status: failed.length === 0 ? 'PASS' : 'FAIL',
  total: results.length,
  passed: results.filter((r) => r.ok).length,
  failed,
  results,
}, null, 2));