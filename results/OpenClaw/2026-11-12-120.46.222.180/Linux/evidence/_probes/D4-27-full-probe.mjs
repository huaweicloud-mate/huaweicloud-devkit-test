#!/usr/bin/env node
// D4-27 双路径输出脱敏 —— 完整探针（覆盖 = 形态 与 空格分隔形态）
// 旧探针仅测 --key=value 等号形态，漏测 --key value 空格形态（真实缺口）。
import { pathToFileURL } from 'node:url';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { redactSecrets, redactString } = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
const { redactOutput } = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);

const AK = 'AKIAIOSFODNN7EXAMPLE';
const SK = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const TOKEN = 'T0K3N_SECRET_VALUE_12345';

function scanLeak(text) {
  const leaks = [];
  for (const [k, v] of [['AK', AK], ['SK', SK], ['TOKEN', TOKEN]]) {
    if (String(text).includes(v)) leaks.push(k);
  }
  return leaks;
}

const results = [];
function check(name, input, fn, mode) {
  const out = fn(input);
  const leaks = scanLeak(out);
  const ok = leaks.length === 0;
  results.push({ name, ok, mode, leaks, input: String(input).slice(0, 80), output: String(out).slice(0, 120) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name} ${ok ? '' : 'LEAKS=' + leaks.join(',')}`);
  return ok;
}

// = 形态（对照，应通过）
check('redactSecrets --key=value (等号形态)', `--access-key=${AK} --secret-key=${SK}`, redactSecrets, '=');
// 空格分隔形态（真实缺口）
check('redactSecrets --key value (空格形态)', `--access-key ${AK} --secret-key ${SK} --security-token ${TOKEN}`, redactSecrets, 'space');
check('redactSecrets key 空格 value', `access_key ${AK} secret_key ${SK}`, redactSecrets, 'space');
// redactOutput 双路径
check('redactOutput JSON 对象路径', JSON.stringify({ access_key: AK, secret_key: SK, token: TOKEN }), redactOutput, '=');
check('redactOutput 非JSON key=value', `access_key=${AK} secret_key=${SK} token=${TOKEN}`, redactOutput, '=');
check('redactOutput 非JSON 空格形态', `access_key ${AK} secret_key ${SK}`, redactOutput, 'space');

const okCount = results.filter(r => r.ok).length;
const summary = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  passed: okCount,
  failed: results.length - okCount,
  conclusion: `${okCount}/${results.length} 通过；空格分隔形态（--key value / key value）脱敏缺口为真实缺陷`,
  results,
};
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify(summary, null, 2));
process.exit(0);