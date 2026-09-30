// D8-9: Config migration test
// Tests the config migration flow: uninstall saves delta, reinstall applies it.
// Flow: extractUserDelta -> saveAgentDelta -> [simulated uninstall] -> takeAgentDelta -> applyUserDelta
import { saveAgentDelta, takeAgentDelta, readAgentDelta, mcpBackupFilePath } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-config-backup.mjs';
import { extractUserDelta, applyUserDelta, mergeArgsStyle, mergeCommandStyle } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tmpDir = mkdtempSync(join(tmpdir(), 'd8-9-'));
const backupFile = join(tmpDir, 'migration-backup.json');
const mcpPath = '/path/to/mcp-server.mjs';
const checks = [];

// Step 1: Simulate existing config with user customizations (args style)
const existingConfig = {
  command: 'node',
  args: [mcpPath, '--transport', 'remote', '--port', '9999'],
  env: { HCLOUD_BIN: '/usr/local/bin/hcloud', HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'officeace', STS_KEY: 'temp-sts-123' },
  timeout: 120000,
  enabled: true,
};

// Step 2: Extract user delta before uninstall
const userDelta = extractUserDelta(existingConfig, 'args');
checks.push({
  name: 'Step 2: extractUserDelta captures user customizations',
  pass: userDelta?.argsExtra?.length === 4 && // --transport, remote, --port, 9999
        userDelta?.env?.STS_KEY === 'temp-sts-123' &&
        userDelta?.timeout === 120000,
  evidence: `argsExtra=${JSON.stringify(userDelta?.argsExtra)}, env.STS_KEY=${userDelta?.env?.STS_KEY}, timeout=${userDelta?.timeout}`,
});

// Step 3: Save delta to backup (simulating uninstall)
const saved = saveAgentDelta('workbuddy', userDelta, backupFile);
checks.push({
  name: 'Step 3: saveAgentDelta persists delta for agent',
  pass: saved && existsSync(backupFile),
  evidence: `saved=${saved}, fileExists=${existsSync(backupFile)}`,
});

// Step 4: Simulate fresh install - create default entry
const freshEntry = mergeArgsStyle(null, { mcpPath, env: { HCLOUD_BIN: '/new/path/hcloud', HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'officeace' } });
checks.push({
  name: 'Step 4: Fresh install creates default entry',
  pass: freshEntry.entry.command === 'node' && freshEntry.entry.args?.[0] === mcpPath,
  evidence: `command=${freshEntry.entry.command}, args[0]=${freshEntry.entry.args?.[0]}`,
});

// Step 5: Take delta from backup (simulating reinstall migration)
const takenDelta = takeAgentDelta('workbuddy', backupFile);
checks.push({
  name: 'Step 5: takeAgentDelta retrieves saved delta',
  pass: takenDelta?.argsExtra?.length > 0 && takenDelta?.env?.STS_KEY === 'temp-sts-123',
  evidence: `argsExtra=${JSON.stringify(takenDelta?.argsExtra)}, env.STS_KEY=${takenDelta?.env?.STS_KEY}`,
});

// Step 6: Apply delta to fresh entry (migration complete)
const migratedEntry = applyUserDelta(freshEntry.entry, takenDelta, 'args');
checks.push({
  name: 'Step 6: applyUserDelta restores user customizations onto fresh entry',
  pass: migratedEntry.args?.includes('--transport') &&
        migratedEntry.args?.includes('remote') &&
        migratedEntry.args?.includes('--port') &&
        migratedEntry.args?.includes('9999') &&
        migratedEntry.env?.STS_KEY === 'temp-sts-123' &&
        migratedEntry.timeout === 120000,
  evidence: `args=${JSON.stringify(migratedEntry.args)}, env.STS_KEY=${migratedEntry.env?.STS_KEY}, timeout=${migratedEntry.timeout}`,
});

// Step 7: Verify backup consumed (take-once semantics)
const readAfterConsume = readAgentDelta('workbuddy', backupFile);
checks.push({
  name: 'Step 7: Backup consumed (take-once semantics)',
  pass: readAfterConsume === null,
  evidence: `readAfterConsume=${readAfterConsume}`,
});

// Step 8: Command style migration also works
const cmdConfig = { type: 'local', command: ['node', mcpPath, '--debug'], env: { MY_VAR: 'xyz' }, timeout: 50000 };
const cmdDelta = extractUserDelta(cmdConfig, 'command');
saveAgentDelta('opencode', cmdDelta, backupFile);
const takenCmdDelta = takeAgentDelta('opencode', backupFile);
const freshCmd = mergeCommandStyle(null, { mcpPath });
const migratedCmd = applyUserDelta(freshCmd.entry, takenCmdDelta, 'command');
checks.push({
  name: 'Step 8: Command-style migration round-trip',
  pass: migratedCmd.command?.includes('--debug') && migratedCmd.env?.MY_VAR === 'xyz' && migratedCmd.timeout === 50000,
  evidence: `command=${JSON.stringify(migratedCmd.command)}, env.MY_VAR=${migratedCmd.env?.MY_VAR}, timeout=${migratedCmd.timeout}`,
});

// Cleanup
rmSync(tmpDir, { recursive: true, force: true });

const allPass = checks.every(c => c.pass);
const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D8-9',
  why: allPass
    ? `All ${checks.length} config migration steps verified: extract delta -> save -> fresh install -> take delta -> apply delta. Both args-style and command-style migrations work. Take-once semantics confirmed.`
    : `Failed checks: ${JSON.stringify(checks.filter(c => !c.pass))}`,
  executedAt: '20260930103000',
  details: checks,
};

console.log(JSON.stringify(output, null, 2));