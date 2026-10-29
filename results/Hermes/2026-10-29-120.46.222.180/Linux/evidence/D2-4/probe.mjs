// D2-4 凭证脱敏正确性（redactSecrets 函数级）探针 —— Hermes Linux 2026-10-29 真机重跑
// 断言：redactSecrets 应对所有形态的 AK/SK 脱敏：大写 AK=/SK=、小写 ak=/sk=、
//       JSON 带引号 key {"ak":...}/{"sk":...}、对象键 accessKeyId/secretAccessKey。
// 根因（FAIL）：safety-policy.mjs redactString 第三个 .replace 的 (AK|SK) 正则大小写敏感(无 /i)，
//   且 isSecretKeyName 键名正则不匹配裸 "ak"/"sk" —— 小写 ak=/sk= 与 JSON 带引号 key 原样明文返回。
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
const EVID = dirname(fileURLToPath(import.meta.url));
const sp = await import('file://' + SRC);
const { redactSecrets } = sp;

const lines = [];
const records = [];
const RED = '<redacted>';
const isRed = (s) => s.includes(RED);

function t(id, name, got, expectRedacted, detail) {
  const leaked = /AK123|SKsec|sec_ak|sec_sk|HPUA\w{6}/.test(String(got));
  const pass = expectRedacted ? (isRed(got) && !leaked) : (!isRed(got) && String(got) === detail);
  records.push({ id, name, pass, actual: String(got).slice(0, 80), expected: expectRedacted ? RED : '原值(非敏感键不改)' });
  lines.push(`  [${pass ? 'OK' : (expectRedacted ? '<<< 未脱敏' : 'FAIL')}] ${name} -> ${JSON.stringify(String(got).slice(0, 60))}`);
  return pass;
}

lines.push('=== D2-4 凭证脱敏正确性（redactSecrets 函数级）===');

// 基线：大写 AK=/SK=（应脱敏）
let baselineOk = t('D2-4-baseline-upper', 'redactSecrets("AK=AK123456 SK=SKsecret")', redactSecrets('AK=AK123456 SK=SKsecret'), true);

// 缺陷：小写 ak=/sk=（当前缺 /i，未脱敏）
let lowerOk = t('D2-4-lower', 'redactSecrets("ak=AK123456 sk=SKsecret")', redactSecrets('ak=AK123456 sk=SKsecret'), true);

// 缺陷：JSON 带引号 key {"ak":...} （键名不匹配裸 ak/sk，未脱敏）
let jsonOk = t('D2-4-json', 'redactSecrets(\'{"ak":"AK123456","sk":"SKsecret"}\')', redactSecrets('{"ak":"AK123456","sk":"SKsecret"}'), true);

// 基线：对象键（应脱敏）
const obj = redactSecrets({ accessKeyId: 'HPUAbcdef123', secretAccessKey: 'sec_sk_long', region: 'cn-north-4' });
let objOk = obj.accessKeyId === RED && obj.secretAccessKey === RED && obj.region === 'cn-north-4';
records.push({ id: 'D2-4-obj', name: 'redactSecrets({accessKeyId,secretAccessKey,region})', pass: objOk, actual: JSON.stringify(obj), expected: 'accessKeyId/secretAccessKey=<redacted>, region 原值' });
lines.push(`  [${objOk ? 'OK' : 'FAIL'}] 对象键脱敏 -> ${JSON.stringify(obj)}`);

const pass = baselineOk && lowerOk && jsonOk && objOk;
lines.push(`RESULT: ${pass ? 'PASS' : 'FAIL'}  大写=${baselineOk ? 'OK' : 'X'} 小写=${lowerOk ? 'OK' : '未脱敏'} JSON引号key=${jsonOk ? 'OK' : '未脱敏'} 对象键=${objOk ? 'OK' : 'X'}`);
lines.push('根因: safety-policy.mjs redactString (AK|SK) 正则大小写敏感 + isSecretKeyName 不匹配裸 ak/sk 键名');

const out = lines.join('\n') + '\n';
writeFileSync(join(EVID, 'stdout.txt'), out, 'utf8');

const why = 'src/safety-policy.mjs redactString 第三个 .replace 的 (AK|SK) 正则大小写敏感(无 /i)，小写 ak=/sk= 与 JSON 带引号 key {"ak":...} 均未脱敏、原样明文返回';
const executedAt = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
writeFileSync(join(EVID, 'stdout.log'), JSON.stringify({ status: pass ? 'PASS' : 'FAIL', executedAt, why }, null, 2), 'utf8');

console.log(out);
console.log(`[D2-4] status=${pass ? 'PASS' : 'FAIL'}`);
process.exit(0);