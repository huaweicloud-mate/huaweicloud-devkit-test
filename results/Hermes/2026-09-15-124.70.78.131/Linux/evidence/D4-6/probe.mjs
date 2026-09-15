// D4-6 adminPass 回显警告（源码级脱敏断言，Hermes Linux）
// 深挖假阻塞：redactString() 可函数级直调核验 adminPass=xxx → <redacted>（无需真云创建 ECS）。
// 断言：
//   ① redactSecrets('adminPass=<value>') → 'adminPass=<redacted>'（字符串直调，走 redactString）
//   ② redactSecrets({adminPass: ...}) → '<redacted>'（对象 key 命中 isSecretKeyName）
//   ③ 正对照：普通非敏感 key 不误伤
import { join } from 'node:path';

const SRCDIR = process.argv[2];
const { redactSecrets } = await import(join(SRCDIR, 'safety-policy.mjs'));

let ok = true;
function check(id, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
  if (!cond) ok = false;
}

const s1 = redactSecrets('adminPass=MyC0mplex!Passw0rd');
const s2 = redactSecrets('--adminPass MyC0mplex!Passw0rd --count 2');
const o1 = redactSecrets({ adminPass: 'MyC0mplex!Passw0rd', hostname: 'ecs-01' });
const s3 = redactSecrets('create ecs with name=web01');
console.log('① adminPass=xxx          =', JSON.stringify(s1));
console.log('② --adminPass xxx        =', JSON.stringify(s2));
console.log('③ 对象 adminPass key      =', JSON.stringify(o1));
console.log('④ 正对照 name=web01       =', JSON.stringify(s3));

check('①adminPass=.. 脱敏', s1 === 'adminPass=<redacted>', '字符串直调 adminPass 值被 <redacted>');
check('②adminPass 空格形态脱敏', s2.includes('adminPass') && !s2.includes('MyC0mplex'), '--adminPass 形态也脱敏且不裸回显');
check('③对象 key 脱敏', o1.adminPass === '<redacted>' && o1.hostname === 'ecs-01', 'adminPass key 整体 <redacted>，其余保留');
check('④不误伤普通值', s3.includes('name=web01') && !s3.includes('<redacted>'), '非敏感 key 不脱敏');

console.log(`\n=== D4-6 源码级脱敏结论: ${ok ? 'ALL PASS' : 'HAS FAIL'} ===`);
console.log('（注：真云 E2E「创建 ECS 含 adminPass 回显警告」需真云写场景，属外部依赖，另以 BLOCKED 四要素记录）');
process.exit(ok ? 0 : 1);