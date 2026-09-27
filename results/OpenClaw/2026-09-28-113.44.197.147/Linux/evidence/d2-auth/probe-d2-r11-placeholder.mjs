// D2 认证 — R11 占位/掩码凭证视为「未配置」探针（v1.1.4-next.6 新增）
import { isPlaceholder } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// 模板/占位值 → 视为未配置（返回 true）
check('D2-R11', '<HW_ACCESS_KEY> 占位', isPlaceholder('<HW_ACCESS_KEY>'), true);
check('D2-R11', '${HW_SECRET_KEY} 模板', isPlaceholder('${HW_SECRET_KEY}'), true);
check('D2-R11', 'YOUR_ACCESS_KEY 关键字', isPlaceholder('YOUR_ACCESS_KEY'), true);
check('D2-R11', 'ACCESS_KEY 裸关键字', isPlaceholder('ACCESS_KEY'), true);
check('D2-R11', 'SECRET_KEY 裸关键字', isPlaceholder('SECRET_KEY'), true);
check('D2-R11', 'placeholder 字面', isPlaceholder('replace_me'), true);
check('D2-R11', 'change.me 字面', isPlaceholder('change.me'), true);
check('D2-R11', '掩码 abc****', isPlaceholder('abc****'), true);
check('D2-R11', '纯星号 ****', isPlaceholder('****'), true);

// 真实凭证 → 判定为已配置（返回 false）
check('D2-R11', '真实 AK (20+ 字母数字) 非占位', isPlaceholder('ABCDEFGHIJKLMNOPQRST1234567890'), false);
check('D2-R11', '真实 SK 非占位', isPlaceholder('x9Kp3Qz7Lm2Nv8Tr5Wy1Uc4Ho6Bs0De'), false);
check('D2-R11', '空串非占位', isPlaceholder(''), false);
check('D2-R11', '普通 region 值非占位', isPlaceholder('cn-north-4'), false);

console.log('\n=== D2-R11 占位/掩码凭证探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);