// D4-27 redactSecrets/redactOutput 双路径脱敏完整性 探针
// 执行: node evidence/D4-27/probe.mjs  (直调 safety-policy.redactSecrets + hcloud-cli.redactOutput)
const HDK = process.env.HDK_PLUGIN_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
const hc = await import(`file://${HDK}/src/hcloud-cli.mjs`);
const { redactSecrets } = sp;
const { redactOutput } = hc;

const V = {
  AK_upper:  'AKUPPER1234567890123',
  SK_upper:  'SKUPPER9876543210987',
  AK_lower:  'AKLOWER1234567890123',
  SK_lower:  'SKLOWER9876543210987',
  token:     'TokenValueABCDEF123456',
  password:  'MyS3cretP@ssw0rd',
  adminPass: 'AdminP@ssw0rd123!',
};
const ALL = Object.values(V);

console.log('=== D4-27 双路径脱敏完整性 ===');

// --- 路径1: redactSecrets 字符串 ---
const sText = [
  `AK=${V.AK_upper}`, `SK=${V.SK_upper}`,
  `ak=${V.AK_lower}`, `sk=${V.SK_lower}`,
  `token=${V.token}`, `password=${V.password}`, `adminPass=${V.adminPass}`,
  `accessKey=${V.AK_upper}`, `secretKey=${V.SK_upper}`, `securityToken=${V.token}`,
].join(' ');
const sOut = redactSecrets(sText);
console.log('\n[路径1] redactSecrets 字符串:');
console.log('  输入:', sText);
console.log('  输出:', sOut);
const sLeaks = ALL.filter(v => sOut.includes(v));
console.log('  脱敏结果:', sLeaks.length ? `仍有明文 ${sLeaks.join(', ')}` : '全部脱敏');

// --- 路径1b: redactSecrets 对象 ---
const obj = {
  accessKeyId: V.AK_upper, secretAccessKey: V.SK_upper, securityToken: V.token,
  password: V.password, adminPass: V.adminPass, normal: 'not-secret',
  nested: { secretKey: V.SK_lower },
};
const oOut = redactSecrets(obj);
const oJson = JSON.stringify(oOut);
const oLeaks = ALL.filter(v => oJson.includes(v));
console.log('\n[路径1b] redactSecrets 对象:', oJson);
console.log('  脱敏结果:', oLeaks.length ? `仍有明文 ${oLeaks.join(', ')}` : '全部脱敏');

// --- 路径2: redactOutput ---
const jsonIn = `{"server":{"name":"t","adminPass":"${V.adminPass}"},"access_key_id":"${V.AK_upper}","secret_access_key":"${V.SK_upper}"}`;
const jOut = redactOutput(jsonIn);
const jLeaks = ALL.filter(v => jOut.includes(v));
console.log('\n[路径2a] redactOutput JSON:', jOut);
console.log('  脱敏结果:', jLeaks.length ? `仍有明文 ${jLeaks.join(', ')}` : '全部脱敏');

const txtIn = `hcloud create ok adminPass=${V.adminPass} password=${V.password} ak=${V.AK_lower}`;
const tOut = redactOutput(txtIn);
const tLeaks = ALL.filter(v => tOut.includes(v));
console.log('\n[路径2b] redactOutput 文本:', tOut);
console.log('  脱敏结果:', tLeaks.length ? `仍有明文 ${tLeaks.join(', ')}` : '全部脱敏');

// --- 断言汇总（唯一可判定） ---
console.log('\n=== D4-27 断言汇总 ===');
const res = [];
function ck(id, label, pass, detail) {
  res.push({ id, label, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${label}${detail ? '  [' + detail + ']' : ''}`);
}
ck('R1', '大写 AK=/SK= 脱敏', !sOut.includes(V.AK_upper) && !sOut.includes(V.SK_upper));
ck('R2', '小写 ak=/sk= 脱敏', !sOut.includes(V.AK_lower) && !sOut.includes(V.SK_lower));
ck('R3', 'token/password/adminPass 脱敏', !sOut.includes(V.token) && !sOut.includes(V.password) && !sOut.includes(V.adminPass));
ck('R4', '对象形式敏感键脱敏', oLeaks.length === 0);
ck('R5', 'redactOutput JSON 脱敏', jLeaks.length === 0);
ck('R6', 'redactOutput 文本脱敏', tLeaks.length === 0);

const nPass = res.filter(r => r.pass).length;
console.log(`\n总计 ${res.length} 条, PASS ${nPass}, FAIL ${res.length - nPass}`);
console.log('结论:', nPass === res.length ? 'PASS (双路径全脱敏)' : 'FAIL (存在脱敏缺口)');