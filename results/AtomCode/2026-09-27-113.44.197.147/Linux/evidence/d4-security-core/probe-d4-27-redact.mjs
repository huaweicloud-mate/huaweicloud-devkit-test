// D4-27 redactSecrets / redactOutput 双路径脱敏完整性（v1.1.5 全量断言）
// 覆盖设计级测试数据全集：AK/SK/token/password/adminPass/secret_key + 大小写变体 + 对象/文本/纯JSON/噪声四形态
import { redactSecrets } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { redactOutput } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';

let pass = 0, fail = 0; const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected; ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
const REDACTED = '<redacted>';

// ===== 路径一：redactSecrets（对象键脱敏，policy.json secretKeyNamePatterns 含 token/ak/sk）=====
{
  const obj = redactSecrets({ ak: 'AKA123', sk: 'SKS456', token: 'TOK789', password: 'pass1', adminPass: 'admp2', secret_key: 'skv3', region: 'cn-north-4' });
  for (const k of ['ak', 'sk', 'token', 'password', 'adminPass', 'secret_key']) {
    check('D4-27', `redactSecrets 对象键 ${k} 脱敏`, obj[k], REDACTED);
  }
  check('D4-27', 'redactSecrets 对象非敏感键 region 保留', obj.region, 'cn-north-4');
}

// ===== 路径二：redactSecrets（文本键=值脱敏，redactString 第二条 replace + (AK|SK) 第三条）=====
{
  // 大写 AK=/SK=（第三条 replace 命中）
  const t1 = redactSecrets('AK=AKA123 SK=SKS456 password=pass1 adminPass=admp2 region=cn-north-4');
  check('D4-27', '文本大写 AK=/SK= 脱敏(无明文)', !/(AKA123|SKS456)/.test(t1), true);
  check('D4-27', '文本 password=/adminPass= 脱敏(无明文)', !/(pass1|admp2)/.test(t1), true);
  // 裸 token= 关键字（设计级测试数据明确含 `token`）
  const t2 = redactSecrets('token=TOK789 password=pass1');
  check('D4-27', '文本裸 token= 关键字脱敏(无明文)', t2.includes(REDACTED) && !t2.includes('TOK789'), true);
  // 小写 ak=/sk=（设计级「AK/SK」小写等价，redactString 第三条 (AK|SK) 无 /i）
  const t3 = redactSecrets('ak=AKA123 sk=SKS456 region=cn-north-4');
  check('D4-27', '文本小写 ak=/sk= 脱敏(无明文)', !/(AKA123|SKS456)/.test(t3), true);
}

// ===== 路径三：redactOutput（纯 JSON 字符串 → JSON.stringify(redactSecrets(parse))）=====
{
  const j = redactOutput(JSON.stringify({ token: 'TOK789', password: 'pass1', adminPass: 'admp2', region: 'cn-north-4' }));
  check('D4-27', 'redactOutput JSON 对象键脱敏(无明文)', !/(TOK789|pass1|admp2)/.test(j), true);
}
// ===== 路径四：redactOutput（非纯 JSON 噪声文本 → fallback redactSecrets 文本路径）=====
{
  const n = redactOutput('prefix-noise\n' + JSON.stringify({ token: 'TOK789', password: 'pass1' }));
  check('D4-27', 'redactOutput 噪声文本路径脱敏(无明文)', !/(TOK789|pass1)/.test(n), true);
}

console.log('\n=== D4-27 双路径脱敏完整性探针结果（v1.1.5 全量断言）===');
for (const l of lines) console.log(l);
console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);