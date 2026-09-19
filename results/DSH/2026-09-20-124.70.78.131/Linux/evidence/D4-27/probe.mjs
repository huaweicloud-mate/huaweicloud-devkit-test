// D4-27 redactSecrets/redactOutput 双路径脱敏完整性
import { pathToFileURL } from 'node:url';

const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { redactSecrets } = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
const { redactOutput } = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);

const results = [];
function check(id, name, pass, actual) { results.push({ id, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) }); }

const SECRETS = ['AKIA1234567890ABCDEFGH', 'SkSecretValue1234567890', 'STSTokenValueXYZ123', 'MyPassword!@#', 'AdminPass12345'];
const hasPlaintext = (s) => SECRETS.some(sec => s.includes(sec));

// 路径1: redactSecrets（文本）
const txt = 'access_key=AKIA1234567890ABCDEFGH secret_key=SkSecretValue1234567890 security_token=STSTokenValueXYZ123 password=MyPassword!@# adminPass=AdminPass12345';
const r1 = redactSecrets(txt);
check('D4-27', 'redactSecrets 文本无明文 AK/SK/token/password/adminPass', !hasPlaintext(r1), r1);

// 路径2: redactSecrets（对象）
const obj = redactSecrets({ AK: 'AKIA1234567890ABCDEFGH', SK: 'SkSecretValue1234567890', securityToken: 'STSTokenValueXYZ123', region: 'cn-north-4' });
const objOk = obj.AK === '<redacted>' && obj.SK === '<redacted>' && obj.securityToken === '<redacted>';
check('D4-27', 'redactSecrets 对象键脱敏(<redacted>)', objOk, obj);

// 路径3: redactOutput（JSON 输出脱敏）
const jsonOut = redactOutput('{"server":{"adminPass":"AdminPass12345","user_data":"echo password=MyPassword!@#"}}');
const jsonHasPlaintext = SECRETS.some(sec => jsonOut.includes(sec));
check('D4-27', 'redactOutput JSON 无明文敏感值', !jsonHasPlaintext, jsonOut.slice(0, 140));

// 路径4: redactOutput（非 JSON 文本回退到 redactSecrets，key=value 形态）
const txtOut = redactOutput('access_key=AKIA1234567890ABCDEFGH password=MyPassword!@#');
check('D4-27', 'redactOutput 非JSON文本无明文', !hasPlaintext(txtOut), txtOut.slice(0, 120));

// 路径5: user_data 整值脱敏（云 init base64 可夹带 SSH key/密码）
const ud = redactSecrets('--server.user_data=base64enc=password=MyPassword!@#');
check('D4-27', 'user_data 整值脱敏无明文 password', !ud.includes('MyPassword!@#'), ud.slice(0, 120));

// 路径6: 裸 token= 关键字脱敏（双路径完整性，用例前置 fixture 含 token）
const bareToken1 = redactSecrets('token=TokenValueABCDEF123456');
check('D4-27', 'redactSecrets 裸 token= 脱敏', !bareToken1.includes('TokenValueABCDEF123456'), bareToken1);
const bareToken2 = redactOutput('token=TokenValueABCDEF123456');
check('D4-27', 'redactOutput 裸 token= 脱敏', !bareToken2.includes('TokenValueABCDEF123456'), bareToken2);

const failed = results.filter(r => !r.pass);
console.log('=== D4-27 双路径脱敏 PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if (failed.length) { console.log('--- FAILED ---'); for (const r of failed) console.log(`  ${r.id} ${r.name} => ${r.actual}`); }