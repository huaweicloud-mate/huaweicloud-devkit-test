import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const results = [];

// Test cases for D4-28: Node 版安全 hook 链路
// hook.json 注册 .mjs, 高危命令决策 deny
const hookPath = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs';

function runHook(payload) {
  return spawnSync(process.execPath, [hookPath], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    timeout: 10000,
  });
}

const testCases = [
  // 高危命令应该被 deny
  { 
    name: '凭证文件读取', 
    payload: { tool_name: 'Bash', tool_input: { command: 'cat ~/.hcloud/config' } },
    expected: 'deny'
  },
  { 
    name: '凭证 env 打印', 
    payload: { tool_name: 'Bash', tool_input: { command: 'echo $HW_SECRET_KEY' } },
    expected: 'deny'
  },
  { 
    name: '高危端口暴露', 
    payload: { 
      tool_name: 'mcp__huaweicloud__create_security_group_rule', 
      tool_input: { 
        command: 'hcloud VPC CreateSecurityGroupRule --security_group_rule.port_range_min=22 --security_group_rule.remote_ip_prefix=0.0.0.0/0'
      }
    },
    expected: 'deny'
  },
  { 
    name: '编码 shell 执行', 
    payload: { tool_name: 'Bash', tool_input: { command: 'echo ZWNobyBoaQ== | base64 -d | bash' } },
    expected: 'deny'
  },
  { 
    name: '写操作命令', 
    payload: { tool_name: 'Bash', tool_input: { command: 'hcloud ECS CreateServers --flavor=x' } },
    expected: 'deny'
  },
  { 
    name: '删除操作命令', 
    payload: { tool_name: 'Bash', tool_input: { command: 'hcloud ECS DeleteServers --server.id=123' } },
    expected: 'deny'
  },
  
  // 安全命令应该被允许 (输出为空)
  { 
    name: '安全读命令', 
    payload: { tool_name: 'Bash', tool_input: { command: 'git status --short' } },
    expected: 'allow'
  },
  { 
    name: '安全 ls 命令', 
    payload: { tool_name: 'Bash', tool_input: { command: 'ls -la' } },
    expected: 'allow'
  },
];

let passCount = 0;
let failCount = 0;

// 首先检查 hook 文件存在
const hookExists = existsSync(hookPath);

results.push({
  case: 'hook 文件存在',
  path: hookPath,
  exists: hookExists,
  status: hookExists ? 'PASS' : 'FAIL'
});

if (hookExists) {
  for (const tc of testCases) {
    const result = runHook(tc.payload);
    
    if (result.status !== 0) {
      results.push({
        case: tc.name,
        error: `Hook exited with status ${result.status}: ${result.stderr}`,
        status: 'FAIL'
      });
      failCount++;
      continue;
    }
    
    let output;
    try {
      output = result.stdout ? JSON.parse(result.stdout) : {};
    } catch (e) {
      results.push({
        case: tc.name,
        error: `Failed to parse hook output: ${e.message}`,
        rawOutput: result.stdout,
        status: 'FAIL'
      });
      failCount++;
      continue;
    }
    
    const decision = output.hookSpecificOutput?.permissionDecision || 'allow';
    const passed = decision === tc.expected;
    
    results.push({
      case: tc.name,
      expected: tc.expected,
      actual: decision,
      reason: output.hookSpecificOutput?.permissionDecisionReason || '',
      passed: passed,
      status: passed ? 'PASS' : 'FAIL'
    });
    if (passed) passCount++;
    else failCount++;
  }
}

const output = {
  suite: 'D4-28',
  description: 'Node 版安全 hook 链路 (hook.json 注册 .mjs, 高危命令决策 deny)',
  total: testCases.length + 1,
  pass: passCount + (hookExists ? 1 : 0),
  fail: failCount + (hookExists ? 0 : 1),
  status: failCount === 0 && hookExists ? 'PASS' : 'FAIL',
  tests: results
};

console.log(JSON.stringify(output, null, 2));
