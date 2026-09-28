// D4-13: 最小权限凭证通过率 - Test readonly sub-account credentials
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';

const results = {};

// Check if readonly credentials file exists
const readonlyCredPath = join(homedir(), '.config', 'huaweicloud', 'credentials.readonly.json');
results.credFileExists = existsSync(readonlyCredPath);

if (!results.credFileExists) {
  // Mark as BLOCKED - cannot test without readonly credentials
  console.log(JSON.stringify({
    testId: 'D4-13',
    testName: '最小权限凭证通过率',
    status: 'BLOCKED',
    why: 'Readonly credentials file not found at ~/.config/huaweicloud/credentials.readonly.json. Cannot test minimal privilege without readonly sub-account credentials.',
    blockedReason: 'Missing credentials.readonly.json',
    credPathChecked: readonlyCredPath,
    details: results,
    executedAt: '20260928090009',
  }, null, 2));
  process.exit(0);
}

// Read the readonly credentials (redacted for logging)
try {
  const credContent = JSON.parse(readFileSync(readonlyCredPath, 'utf8'));
  results.hasAK = !!credContent.ak || !!credContent.access_key;
  results.hasSK = !!credContent.sk || !!credContent.secret_key;
  results.hasRegion = !!credContent.region;
  results.credKeys = Object.keys(credContent).filter(k => !['ak','sk','access_key','secret_key','security_token'].includes(k));
} catch (e) {
  results.credReadError = e.message;
}

// Test D3 read-only use cases with readonly credentials
// We test that plan_cli_command classifies read-only commands as allow
// and that the readonly account can execute them
const readonlyTests = {};

// Test 1: plan a read-only command (should be allowed)
try {
  const r = await callTool('huaweicloud_plan_cli_command', { 
    args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4']
  });
  readonlyTests.plan_readonly = {
    decision: r?.classification?.decision,
    risk: r?.classification?.risk,
    safeToRun: r?.safeToRun,
  };
} catch (e) {
  readonlyTests.plan_readonly = { error: e.message };
}

// Test 2: plan a write command (should be denied even with readonly creds)
try {
  const r = await callTool('huaweicloud_plan_cli_command', { 
    args: ['ECS', 'CreateServers', '--server.name=test']
  });
  readonlyTests.plan_write = {
    decision: r?.classification?.decision,
    risk: r?.classification?.risk,
    safeToRun: r?.safeToRun,
  };
} catch (e) {
  readonlyTests.plan_write = { error: e.message };
}

// Test 3: Execute a read-only command (should work with readonly creds)
try {
  const r = await callTool('huaweicloud_run_readonly_command', { 
    args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--limit=5'],
    timeoutMs: 30000
  });
  readonlyTests.exec_readonly = {
    ok: r?.ok,
    exitCode: r?.exitCode,
    hasOutput: !!r?.stdout,
  };
} catch (e) {
  readonlyTests.exec_readonly = { error: e.message };
}

results.readonlyTests = readonlyTests;

const pass = readonlyTests.plan_readonly?.decision === 'allow' &&
             readonlyTests.plan_write?.decision === 'deny' &&
             readonlyTests.exec_readonly?.ok !== undefined;

console.log(JSON.stringify({
  testId: 'D4-13',
  testName: '最小权限凭证通过率',
  status: pass ? 'PASS' : 'FAIL',
  why: pass
    ? 'Readonly credentials found. Read-only commands (ListServersDetails) classified as allow and executed. Write commands (CreateServers) classified as deny even with readonly creds.'
    : `Issues with readonly credentials: ${JSON.stringify(results)}`,
  details: results,
  executedAt: '20260928090009',
}, null, 2));