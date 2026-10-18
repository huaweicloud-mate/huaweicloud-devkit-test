#!/usr/bin/env node
// D4-27 redactSecrets / redactOutput 双路径脱敏完整性
// Hermes Linux 2026-09-18 每日测试 —— 全假凭证 fixture，扫描脱敏后无明文残留。
// 测试数据（与用例一致）：AK/SK/token/password/adminPass/secret_key 混合文本。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const SRC = process.env.HDK_SRC || '/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { redactSecrets } = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const { redactOutput } = await import(pathToFileURL(join(SRC, 'hcloud-cli.mjs')).href);

const SECRETS = {
  AK: 'AKIAIOSFODNN7EXAMPLE',
  SK: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  TOKEN: 'T0K3N_SECRET_VALUE_12345',
  PASSWORD: 'P@ssw0rd_Secret_98765',
  ADMINPASS: 'AdminP@ss_S3cret_55555',
  SECRETKEY: 'sUp3r_SecretKey_66666',
};

// 明文残留扫描：输出文本仍含任一明文敏感值即泄露
function scanLeak(text) {
  const leaks = [];
  for (const [k, v] of Object.entries(SECRETS)) {
    if (String(text).includes(v)) leaks.push(k);
  }
  return leaks;
}

const out = [];
function record(name, ok, detail) {
  const d = typeof detail === 'object' && detail !== null ? JSON.stringify(detail) : String(detail);
  out.push({ name, ok, detail: d.slice(0, 600) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}
function check(name, input, redacted) {
  const leaks = scanLeak(redacted);
  record(name, leaks.length === 0, leaks.length ? { input: String(input).slice(0, 120), leaks, output: String(redacted).slice(0, 160) } : { output: String(redacted).slice(0, 120) });
  return leaks.length === 0;
}

// ===== 路径 1：redactSecrets（safety-policy.mjs）=====
// 1a. 字符串路径（key=value / key:value）
const strText = `access_key=${SECRETS.AK} secret_key=${SECRETS.SK} token=${SECRETS.TOKEN} password=${SECRETS.PASSWORD} adminPass=${SECRETS.ADMINPASS} secret_key=${SECRETS.SECRETKEY}`;
check('redactSecrets 字符串 key=value（AK/SK/token/password/adminPass/secret_key）', strText, redactSecrets(strText));

// 1b. 字符串路径（CLI flag 风格 --key value）
const flagText = `--access-key=${SECRETS.AK} --secret-key=${SECRETS.SK} --security-token=${SECRETS.TOKEN} --password=${SECRETS.PASSWORD} --admin-pass=${SECRETS.ADMINPASS} --secret_key=${SECRETS.SECRETKEY}`;
check('redactSecrets 字符串 CLI-flag（--key value）', flagText, redactSecrets(flagText));

// 1c. 对象路径（嵌套 key 匹配 isSecretKeyName）
const objText = { access_key: SECRETS.AK, secret_key: SECRETS.SK, token: SECRETS.TOKEN, password: SECRETS.PASSWORD, adminPass: SECRETS.ADMINPASS, secret_key_2: SECRETS.SECRETKEY, nested: { ak: SECRETS.AK, sk: SECRETS.SK } };
check('redactSecrets 对象路径（含嵌套 ak/sk/token）', JSON.stringify(objText), redactSecrets(objText));

// ===== 路径 2：redactOutput（hcloud-cli.mjs）=====
// 2a. JSON 字符串（走 JSON.parse + redactSecrets 对象路径）
const jsonText = JSON.stringify({ access_key: SECRETS.AK, secret_key: SECRETS.SK, token: SECRETS.TOKEN, password: SECRETS.PASSWORD, adminPass: SECRETS.ADMINPASS, secret_key_2: SECRETS.SECRETKEY });
check('redactOutput JSON 字符串（对象路径）', jsonText, redactOutput(jsonText));

// 2b. 非 JSON 回退（走 redactSecrets 字符串路径）
const plainText = `stdout: access_key=${SECRETS.AK} secret_key=${SECRETS.SK} token=${SECRETS.TOKEN} password=${SECRETS.PASSWORD} adminPass=${SECRETS.ADMINPASS}`;
check('redactOutput 非 JSON 回退（字符串路径）', plainText, redactOutput(plainText));

const summary = {
  generatedAt: new Date().toISOString(),
  total: out.length,
  passed: out.filter((o) => o.ok).length,
  failed: out.filter((o) => !o.ok).length,
  conclusion: `${out.filter((o) => o.ok).length}/${out.length} 项双路径脱敏无明文残留`,
  results: out,
};
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify(summary, null, 2));
process.exit(0);