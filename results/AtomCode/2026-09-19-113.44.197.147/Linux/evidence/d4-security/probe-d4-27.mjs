// D4-27 redactSecrets / redactOutput 双路径脱敏完整性
import { redactSecrets } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { redactOutput } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';

const AK = 'AKIA1234567890ABCDEF';
const SK = 'SK_abcdefghijklmnopqrstuvwxyz1234';
const TK = 'tok_secret_security_token_value';
const PW = 'SuperSecretPass123!';
const AP = 'AdminPassXYZ999';

let pass = 0, fail = 0;
function chk(id, desc, ok, detail) {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${ok}${detail ? ' | ' + detail : ''}`);
}
const noPlain = (s, secrets) => secrets.every((sec) => !String(s).includes(sec));

// 路径1：redactSecrets（对象）——按 secret key name 整值脱敏
const r1 = redactSecrets({ ak: AK, sk: SK, securityToken: TK, password: PW, adminPass: AP, region: 'cn-north-4' });
const secretKeys = ['ak', 'sk', 'securityToken', 'password', 'adminPass'];
chk('D4-27', 'redactSecrets 对象：5 个敏感 key 全部 <redacted>', secretKeys.every((k) => r1[k] === '<redacted>'), JSON.stringify(r1));
chk('D4-27', 'redactSecrets 无明文残留', noPlain(JSON.stringify(r1), [AK, SK, TK, PW, AP]), '');

// 路径2：redactOutput（JSON）——JSON 解析后走 redactSecrets 对象脱敏
const r2 = redactOutput(JSON.stringify({ AccessKey: AK, SecretKey: SK, SecurityToken: TK }));
chk('D4-27', 'redactOutput(JSON) 无明文残留', noPlain(r2, [AK, SK, TK]), r2.replace(/\s+/g, ' ').slice(0, 120));

// 路径2：redactOutput（纯文本）——redactString 正则脱敏（adminPass=/password=/AK=/SK=）
const r3 = redactOutput(`adminPass=${AP} password=${PW} AK=${AK} SK=${SK}`);
chk('D4-27', 'redactOutput(纯文本) 无明文残留', noPlain(r3, [AP, PW, AK, SK]), 'r3=' + r3);

console.log(`TOTAL pass=${pass} fail=${fail}`);