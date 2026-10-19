// D4-6 adminPass 回显警告（源码级脱敏断言，Hermes Linux）
// 深挖假阻塞：redactString() 可函数级直调核验 adminPass=xxx → <redacted>（无需真云创建 ECS）。
// 母版两段式断言 — ①源码级「adminPass=xxx→<redacted>」本探针覆盖（退出码按此判定）；②真云 E2E 属外部依赖。
// 附：直调过程中发现 redactString 未覆盖 CLI flag 形态（--admin_pass <pwd>）与 JSON 带引号 key，
//     作为独立缺陷记录（FINDINGS #7 → 历史 #561），此处仅打印观察证据，不纳入本用例 PASS/FAIL 判定。
import { join } from 'node:path';

const SRCDIR = process.argv[2];
const { redactSecrets } = await import(join(SRCDIR, 'safety-policy.mjs'));

let ok = true;
function check(id, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
  if (!cond) ok = false;
}

// ---- 母版源码级断言（判定 D4-6）----
const s1 = redactSecrets('adminPass=MyC0mplex!Passw0rd');
const o1 = redactSecrets({ adminPass: 'MyC0mplex!Passw0rd', hostname: 'ecs-01' });
const s3 = redactSecrets('create ecs with name=web01');
console.log('① adminPass=xxx          =', JSON.stringify(s1));
console.log('③ 对象 adminPass key      =', JSON.stringify(o1));
console.log('④ 正对照 name=web01       =', JSON.stringify(s3));
check('①adminPass=.. 脱敏', s1 === 'adminPass=<redacted>', '字符串直调 adminPass 值 <redacted>（母版断言）');
check('③对象 key 脱敏', o1.adminPass === '<redacted>' && o1.hostname === 'ecs-01', 'adminPass key 整体 <redacted>，其余保留');
check('④不误伤普通值', s3.includes('name=web01') && !s3.includes('<redacted>'), '非敏感 key 不脱敏');

// ---- FINDINGS #7 观察证据（非本用例判定）----
const obsFlag = redactSecrets('--admin_pass MyPwd123');
const obsJson = redactSecrets('{"server":{"adminPass":"MyPwd123"}}');
console.log('[FINDING] --admin_pass 空格形态 =', JSON.stringify(obsFlag), '→ 未脱敏');
console.log('[FINDING] JSON 带引号 key 形态  =', JSON.stringify(obsJson), '→ 未脱敏');

console.log(`\n=== D4-6 源码级脱敏结论: ${ok ? 'ALL PASS' : 'HAS FAIL'} ===`);
console.log('（注：真云 E2E「创建 ECS 含 adminPass 回显警告」需真云写场景，属外部依赖，另以 BLOCKED 四要素记录；flag/JSON 形态缺口见 FINDINGS #7）');
process.exit(ok ? 0 : 1);