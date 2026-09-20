// AI生成
/**
 * D4-18: confirm-not-deny 审批语义
 * 
 * 验证：写操作需显式确认，不被直接拒绝也不被直接放行
 * 
 * 通过源码直调 classifyHcloudArgs 验证：
 * 1. allowWrites=false (默认/未确认) → decision=deny, risk=write (需要确认，不是永久拒绝)
 * 2. allowWrites=true (已确认) → decision=allow, risk=write (确认后放行)
 * 3. 读操作 → decision=allow (无需确认)
 * 4. 验证 deny reason 包含 "explicit user approval" 语义（确认而非永久拒绝）
 */
import { pathToFileURL } from 'node:url';
const policyModule = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs').href);
const { classifyHcloudArgs } = policyModule;

const results = [];
let allPass = true;

function check(label, condition, detail) {
  const pass = !!condition;
  if (!pass) allPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (detail) console.log(`  → ${detail}`);
}

console.log('=== D4-18: confirm-not-deny 审批语义 ===\n');

// --- 测试1: 写操作在未确认时返回 deny（需要确认，不是永久拒绝）---
const writeArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4'];
const writeUnconfirmed = classifyHcloudArgs(writeArgs, { allowWrites: false });
console.log('写操作(未确认):', JSON.stringify(writeUnconfirmed));

check(
  'T1: 写操作未确认时 decision=deny',
  writeUnconfirmed.decision === 'deny',
  `decision=${writeUnconfirmed.decision}`
);
check(
  'T1: 写操作 deny 的 risk=write (非 credential/secret 等永久拒绝)',
  writeUnconfirmed.risk === 'write',
  `risk=${writeUnconfirmed.risk}`
);
check(
  'T1: deny reason 包含 "explicit user approval" 语义 (确认而非永久拒绝)',
  /explicit user approval/i.test(writeUnconfirmed.reason),
  `reason="${writeUnconfirmed.reason}"`
);

// --- 测试2: 同一写操作在确认后返回 allow ---
const writeConfirmed = classifyHcloudArgs(writeArgs, { allowWrites: true });
console.log('\n写操作(已确认):', JSON.stringify(writeConfirmed));

check(
  'T2: 写操作确认后 decision=allow',
  writeConfirmed.decision === 'allow',
  `decision=${writeConfirmed.decision}`
);
check(
  'T2: 确认后 risk 仍为 write (风险标记保留)',
  writeConfirmed.risk === 'write',
  `risk=${writeConfirmed.risk}`
);
check(
  'T2: 确认后 reason 包含 "approved" 语义',
  /approved/i.test(writeConfirmed.reason),
  `reason="${writeConfirmed.reason}"`
);

// --- 测试3: 读操作无需确认即可 allow ---
const readArgs = ['ECS', 'ListServers', '--cli-region=cn-north-4'];
const readResult = classifyHcloudArgs(readArgs);
console.log('\n读操作:', JSON.stringify(readResult));

check(
  'T3: 读操作 decision=allow (无需确认)',
  readResult.decision === 'allow',
  `decision=${readResult.decision}, risk=${readResult.risk}`
);

// --- 测试4: 核心语义验证 - confirm-not-deny ---
// deny 是 "需要确认" 的 deny，不是 "永久禁止" 的 deny
// 证据：同一命令在 allowWrites=false 时 deny，allowWrites=true 时 allow
check(
  'T4: confirm-not-deny 核心语义 - deny(未确认) → allow(已确认) 转换存在',
  writeUnconfirmed.decision === 'deny' && writeConfirmed.decision === 'allow',
  `未确认:${writeUnconfirmed.decision} → 已确认:${writeConfirmed.decision}`
);

// --- 测试5: execution 类操作同样遵循 confirm-not-deny ---
const execArgs = ['FunctionGraph', 'InvokeFunction', '--function_urn=urn:fgs:cn-north-4:test'];
const execUnconfirmed = classifyHcloudArgs(execArgs, { allowWrites: false });
const execConfirmed = classifyHcloudArgs(execArgs, { allowWrites: true });
console.log('\n执行类操作(未确认):', JSON.stringify(execUnconfirmed));
console.log('执行类操作(已确认):', JSON.stringify(execConfirmed));

check(
  'T5: execution 类操作 confirm-not-deny (deny→allow)',
  execUnconfirmed.decision === 'deny' && execConfirmed.decision === 'allow',
  `未确认:${execUnconfirmed.decision}(risk=${execUnconfirmed.risk}) → 已确认:${execConfirmed.decision}(risk=${execConfirmed.risk})`
);

// --- 测试6: credential/secret 类操作是永久 deny（不可通过确认放行）---
const secretArgs = ['KMS', 'ShowSecretVersion', '--secret_id=test'];
const secretUnconfirmed = classifyHcloudArgs(secretArgs, { allowWrites: false });
const secretConfirmed = classifyHcloudArgs(secretArgs, { allowWrites: true });
console.log('\nSecret操作(未确认):', JSON.stringify(secretUnconfirmed));
console.log('Secret操作(已确认):', JSON.stringify(secretConfirmed));

check(
  'T6: secret 类操作永久 deny (确认也不放行) - 区分于 write 的 confirm 语义',
  secretUnconfirmed.decision === 'deny' && secretConfirmed.decision === 'deny',
  `未确认:${secretUnconfirmed.decision}(risk=${secretUnconfirmed.risk}) → 已确认:${secretConfirmed.decision}(risk=${secretConfirmed.risk})`
);

console.log(`\n=== D4-18 结果: ${allPass ? 'PASS' : 'FAIL'} ===`);
process.exit(allPass ? 0 : 1);
