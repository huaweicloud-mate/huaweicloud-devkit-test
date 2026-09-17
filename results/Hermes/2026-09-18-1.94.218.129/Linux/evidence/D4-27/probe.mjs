// D4-27 (P1): redactSecrets/redactOutput 双路径脱敏完整性
// 直调 safety-policy.mjs redactSecrets(49) + hcloud-cli.mjs redactOutput(587)。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const SRC = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const { redactSecrets } = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const { redactOutput } = await import(pathToFileURL(join(SRC, 'hcloud-cli.mjs')).href);

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0,120), expected: String(expected) });
}

const SECRETS = {
  ak: 'AKIDZ1X2Y3Z4A5B6C7D8',
  sk: 'SECRETKEY_abcdef1234567890',
  token: 'STSTOKEN_abcdef1234567890',
  password: 'MySuperSecretPass123',
  adminPass: 'Admin@Passw0rd!',
};

function leakCheck(id, pathName, out) {
  const s = JSON.stringify(out);
  for (const [k, v] of Object.entries(SECRETS)) {
    test(id, `${pathName}-${k}`, !s.includes(v), s.includes(v) ? `泄露 ${k}` : `已脱敏 ${k}`, `${k} 无明文`);
  }
}

// 1) redactSecrets 字符串路径
const s1 = redactSecrets(`ak=${SECRETS.ak} sk=${SECRETS.sk} token=${SECRETS.token} password=${SECRETS.password} adminPass=${SECRETS.adminPass}`);
leakCheck('D4-27', 'redactSecrets', s1);

// 2) redactSecrets 对象路径
const s2 = redactSecrets({ ak: SECRETS.ak, sk: SECRETS.sk, adminPass: SECRETS.adminPass });
leakCheck('D4-27', 'redactSecrets-obj', s2);

// 3) redactOutput 字符串路径
const o1 = redactOutput(`adminPass: ${SECRETS.adminPass} AK=${SECRETS.ak}`);
leakCheck('D4-27', 'redactOutput', o1);

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-18-1.94.218.129/Linux/evidence/D4-27/stdout.log'), output, 'utf8');
console.log(output);