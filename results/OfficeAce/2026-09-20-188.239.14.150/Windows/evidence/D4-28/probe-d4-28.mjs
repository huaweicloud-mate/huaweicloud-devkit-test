// AI生成
/**
 * D4-28: Node 版安全 hook 链路
 *
 * 验证：
 * 1. hooks.json 注册 .mjs (Node 实现)
 * 2. tool_input 内 command/cmd/script/args 均被提取 (commandText)
 * 3. 高危命令决策 deny 且输出 hookSpecificOutput.permissionDecision=deny
 * 4. 非高危无 deny 输出
 *
 * 方法：
 * A) 读取 hooks.json 验证注册 node huaweicloud-safety.mjs
 * B) 源码直调 classifyTextCommand 验证高危命令 deny
 * C) 实际执行 hook 脚本 (通过 stdin 传 JSON) 验证完整链路
 */
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const policyModule = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs').href);
const { classifyTextCommand } = policyModule;

const HOOKS_JSON = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/hooks/hooks.json';
const HOOK_MJS = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs';

let allPass = true;

function check(label, condition, detail) {
  const pass = !!condition;
  if (!pass) allPass = false;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (detail) console.log(`  → ${detail}`);
}

console.log('=== D4-28: Node 版安全 hook 链路 ===\n');

// ============================================================
// Part A: hooks.json 注册 .mjs (Node 实现)
// ============================================================
console.log('--- Part A: hooks.json 注册验证 ---');

const hooksJson = JSON.parse(readFileSync(HOOKS_JSON, 'utf8'));
console.log('hooks.json:', JSON.stringify(hooksJson, null, 2));

const preToolUseHooks = hooksJson.hooks?.PreToolUse || [];
const allHookCommands = preToolUseHooks.flatMap((entry) => entry.hooks.map((h) => h.command));

check(
  'A1: hooks.json 存在 PreToolUse 配置',
  preToolUseHooks.length > 0,
  `PreToolUse entries: ${preToolUseHooks.length}`
);

check(
  'A2: hook command 使用 node 执行 .mjs (Node 实现)',
  allHookCommands.some((cmd) => /node.*huaweicloud-safety\.mjs/.test(cmd)),
  `commands: ${JSON.stringify(allHookCommands)}`
);

check(
  'A3: hook 注册 Bash matcher',
  preToolUseHooks.some((e) => e.matcher === 'Bash'),
  `matchers: ${JSON.stringify(preToolUseHooks.map((e) => e.matcher))}`
);

check(
  'A4: hook 注册 huaweicloud MCP matcher',
  preToolUseHooks.some((e) => /huaweicloud/.test(e.matcher)),
  `matchers: ${JSON.stringify(preToolUseHooks.map((e) => e.matcher))}`
);

check(
  'A5: huaweicloud-safety.mjs 文件存在',
  existsSync(HOOK_MJS),
  `path: ${HOOK_MJS}`
);

// ============================================================
// Part B: commandText 提取验证 (源码直调)
// ============================================================
console.log('\n--- Part B: commandText 提取验证 ---');

// 复现 commandText 逻辑 (huaweicloud-safety.mjs:7-20)
function commandText(toolInput) {
  if (typeof toolInput === 'string') return toolInput;
  if (toolInput && typeof toolInput === 'object') {
    const values = [];
    for (const key of ['command', 'cmd', 'script', 'args', 'arguments']) {
      const value = toolInput[key];
      if (Array.isArray(value)) values.push(value.map(String).join(' '));
      else if (value !== undefined && value !== null) values.push(String(value));
    }
    if (values.length > 0) return values.join('\n');
    return JSON.stringify(toolInput);
  }
  return JSON.stringify(toolInput);
}

// B1: command 字段
const ct1 = commandText({ command: 'echo $HW_SECRET_KEY' });
check('B1: command 字段提取', ct1 === 'echo $HW_SECRET_KEY', `result="${ct1}"`);

// B2: cmd 字段
const ct2 = commandText({ cmd: 'env | grep HUAWEICLOUD' });
check('B2: cmd 字段提取', ct2 === 'env | grep HUAWEICLOUD', `result="${ct2}"`);

// B3: script 字段
const ct3 = commandText({ script: 'printenv HW_ACCESS_KEY' });
check('B3: script 字段提取', ct3 === 'printenv HW_ACCESS_KEY', `result="${ct3}"`);

// B4: args 字段 (数组)
const ct4 = commandText({ args: ['echo', '$HW_SECRET_KEY'] });
check('B4: args 字段(数组)提取并 join', ct4 === 'echo $HW_SECRET_KEY', `result="${ct4}"`);

// B5: arguments 字段
const ct5 = commandText({ arguments: ['env', 'HUAWEICLOUD_ACCESS_KEY'] });
check('B5: arguments 字段提取', ct5 === 'env HUAWEICLOUD_ACCESS_KEY', `result="${ct5}"`);

// B6: 多字段组合 (command + args)
const ct6 = commandText({ command: 'echo $HW_SECRET_KEY', args: ['extra'] });
check('B6: 多字段组合提取 (command + args 用 \\n 连接)', ct6 === 'echo $HW_SECRET_KEY\nextra', `result="${ct6}"`);

// B7: 字符串 toolInput
const ct7 = commandText('echo $HW_SECRET_KEY');
check('B7: 字符串 toolInput 直接返回', ct7 === 'echo $HW_SECRET_KEY', `result="${ct7}"`);

// B8: 空对象 fallback
const ct8 = commandText({});
check('B8: 空对象 fallback 到 JSON.stringify', ct8 === '{}', `result="${ct8}"`);

// ============================================================
// Part C: classifyTextCommand deny 验证
// ============================================================
console.log('\n--- Part C: classifyTextCommand 高危命令 deny ---');

const denyTests = [
  { name: 'echo $HW_SECRET_KEY', cmd: 'echo $HW_SECRET_KEY', expectRisk: 'credential' },
  { name: 'echo ${HW_ACCESS_KEY}', cmd: 'echo ${HW_ACCESS_KEY}', expectRisk: 'credential' },
  { name: 'printenv HW_SECRET_KEY', cmd: 'printenv HW_SECRET_KEY', expectRisk: 'credential' },
  { name: 'env | grep HUAWEICLOUD', cmd: 'env | grep HUAWEICLOUD', expectRisk: 'credential' },
  { name: 'cat ~/.hcloud/config.json', cmd: 'cat ~/.hcloud/config.json', expectRisk: 'credential' },
];

for (const t of denyTests) {
  const result = classifyTextCommand(t.cmd);
  check(
    `C: "${t.name}" → deny (risk=${t.expectRisk})`,
    result.decision === 'deny',
    `decision=${result.decision}, risk=${result.risk}, reason="${result.reason}"`
  );
}

// ============================================================
// Part D: 非高危命令无 deny
// ============================================================
console.log('\n--- Part D: 非高危命令无 deny ---');

const safeTests = [
  { name: 'ls -la', cmd: 'ls -la' },
  { name: 'echo hello', cmd: 'echo hello' },
  { name: 'git status', cmd: 'git status' },
  { name: 'npm install', cmd: 'npm install' },
];

for (const t of safeTests) {
  const result = classifyTextCommand(t.cmd);
  check(
    `D: "${t.name}" → 非 deny`,
    result.decision !== 'deny',
    `decision=${result.decision}, risk=${result.risk}`
  );
}

// ============================================================
// Part E: 完整 hook 链路 (实际执行 huaweicloud-safety.mjs)
// ============================================================
console.log('\n--- Part E: 完整 hook 链路 (实际执行 .mjs) ---');

function runHook(toolInput) {
  const input = JSON.stringify({ tool_input: toolInput });
  try {
    const stdout = execFileSync('node', [HOOK_MJS], {
      input,
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
    });
    return stdout.trim();
  } catch (e) {
    return { error: e.message, stdout: e.stdout?.trim(), stderr: e.stderr?.trim() };
  }
}

// E1: 高危命令 → hook 输出 permissionDecision:deny
const hookDenyResult = runHook({ command: 'echo $HW_SECRET_KEY' });
console.log('E1 hook 输出:', hookDenyResult);

let e1Parsed = null;
try { e1Parsed = JSON.parse(hookDenyResult); } catch {}

check(
  'E1: 高危命令 hook 输出有效 JSON',
  e1Parsed !== null,
  `parsed: ${JSON.stringify(e1Parsed)}`
);

check(
  'E1: hook 输出 hookSpecificOutput.permissionDecision=deny',
  e1Parsed?.hookSpecificOutput?.permissionDecision === 'deny',
  `permissionDecision=${e1Parsed?.hookSpecificOutput?.permissionDecision}`
);

check(
  'E1: hook 输出 hookEventName=PreToolUse',
  e1Parsed?.hookSpecificOutput?.hookEventName === 'PreToolUse',
  `hookEventName=${e1Parsed?.hookSpecificOutput?.hookEventName}`
);

check(
  'E1: hook 输出 permissionDecisionReason 包含阻断原因',
  typeof e1Parsed?.hookSpecificOutput?.permissionDecisionReason === 'string' &&
    e1Parsed?.hookSpecificOutput?.permissionDecisionReason.length > 0,
  `reason="${e1Parsed?.hookSpecificOutput?.permissionDecisionReason}"`
);

// E2: cmd 字段高危命令 → deny
const hookCmdResult = runHook({ cmd: 'printenv HW_ACCESS_KEY' });
let e2Parsed = null;
try { e2Parsed = JSON.parse(hookCmdResult); } catch {}
console.log('E2 hook 输出 (cmd字段):', hookCmdResult);

check(
  'E2: cmd 字段高危命令 hook 输出 deny',
  e2Parsed?.hookSpecificOutput?.permissionDecision === 'deny',
  `permissionDecision=${e2Parsed?.hookSpecificOutput?.permissionDecision}`
);

// E3: args 字段高危命令 → deny
const hookArgsResult = runHook({ args: ['echo', '$HW_SECRET_KEY'] });
let e3Parsed = null;
try { e3Parsed = JSON.parse(hookArgsResult); } catch {}
console.log('E3 hook 输出 (args字段):', hookArgsResult);

check(
  'E3: args 字段高危命令 hook 输出 deny',
  e3Parsed?.hookSpecificOutput?.permissionDecision === 'deny',
  `permissionDecision=${e3Parsed?.hookSpecificOutput?.permissionDecision}`
);

// E4: script 字段高危命令 → deny
const hookScriptResult = runHook({ script: 'env | grep HUAWEICLOUD' });
let e4Parsed = null;
try { e4Parsed = JSON.parse(hookScriptResult); } catch {}
console.log('E4 hook 输出 (script字段):', hookScriptResult);

check(
  'E4: script 字段高危命令 hook 输出 deny',
  e4Parsed?.hookSpecificOutput?.permissionDecision === 'deny',
  `permissionDecision=${e4Parsed?.hookSpecificOutput?.permissionDecision}`
);

// E5: 非高危命令 → 无 deny 输出 (空输出或无 permissionDecision)
const hookSafeResult = runHook({ command: 'ls -la' });
console.log('E5 hook 输出 (安全命令):', JSON.stringify(hookSafeResult));

check(
  'E5: 非高危命令 hook 无 deny 输出 (空输出)',
  hookSafeResult === '' || hookSafeResult === '{}',
  `output="${hookSafeResult}"`
);

// E6: 多字段组合高危 → deny
const hookMultiResult = runHook({ command: 'echo hello', args: ['echo', '$HW_SECRET_KEY'] });
let e6Parsed = null;
try { e6Parsed = JSON.parse(hookMultiResult); } catch {}
console.log('E6 hook 输出 (多字段组合):', hookMultiResult);

check(
  'E6: 多字段组合含高危 → deny (commandText 合并后检测)',
  e6Parsed?.hookSpecificOutput?.permissionDecision === 'deny',
  `permissionDecision=${e6Parsed?.hookSpecificOutput?.permissionDecision}`
);

console.log(`\n=== D4-28 结果: ${allPass ? 'PASS' : 'FAIL'} ===`);
process.exit(allPass ? 0 : 1);
