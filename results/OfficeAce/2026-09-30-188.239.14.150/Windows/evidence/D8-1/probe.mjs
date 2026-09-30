// D8-1: MCP config file read/write test
// Tests mcp-config-backup.mjs: saveAgentDelta, readAgentDelta, takeAgentDelta, purgeBackup
// Uses a temp file to avoid touching real config.
import { saveAgentDelta, readAgentDelta, takeAgentDelta, purgeBackup, mcpBackupFilePath } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-config-backup.mjs';
import { writeFileSync, readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tmpDir = mkdtempSync(join(tmpdir(), 'd8-1-'));
const backupFile = join(tmpDir, 'test-backup.json');

const checks = [];

// Test 1: Save and read agent delta
const delta1 = { commandExtra: ['--transport', 'remote'], env: { CUSTOM_KEY: 'val123' } };
const saved = saveAgentDelta('agent-A', delta1, backupFile);
checks.push({
  name: 'saveAgentDelta returns true and writes file',
  pass: saved && existsSync(backupFile),
  evidence: `saved=${saved}, fileExists=${existsSync(backupFile)}`,
});

const read1 = readAgentDelta('agent-A', backupFile);
checks.push({
  name: 'readAgentDelta returns saved delta with savedAt',
  pass: read1 && read1.commandExtra && read1.commandExtra[0] === '--transport' && read1.savedAt,
  evidence: `commandExtra=${JSON.stringify(read1?.commandExtra)}, hasSavedAt=${!!read1?.savedAt}`,
});

// Test 2: Read non-existent agent returns null
const readNone = readAgentDelta('agent-B', backupFile);
checks.push({
  name: 'readAgentDelta for non-existent agent returns null',
  pass: readNone === null,
  evidence: `result=${readNone}`,
});

// Test 3: takeAgentDelta consumes (removes) the delta
const taken = takeAgentDelta('agent-A', backupFile);
const readAfterTake = readAgentDelta('agent-A', backupFile);
checks.push({
  name: 'takeAgentDelta returns delta and removes it from file',
  pass: taken && taken.commandExtra && readAfterTake === null,
  evidence: `taken=${!!taken}, readAfterTake=${readAfterTake}`,
});

// Test 4: After taking last agent, backup file is removed
checks.push({
  name: 'Backup file removed after last agent delta consumed',
  pass: !existsSync(backupFile),
  evidence: `fileExists=${existsSync(backupFile)}`,
});

// Test 5: Multiple agents can coexist
saveAgentDelta('agent-X', { timeout: 60000 }, backupFile);
saveAgentDelta('agent-Y', { enabled: false }, backupFile);
const readX = readAgentDelta('agent-X', backupFile);
const readY = readAgentDelta('agent-Y', backupFile);
checks.push({
  name: 'Multiple agents coexist in backup file',
  pass: readX?.timeout === 60000 && readY?.enabled === false,
  evidence: `agentX.timeout=${readX?.timeout}, agentY.enabled=${readY?.enabled}`,
});

// Test 6: purgeBackup removes file
const purged = purgeBackup(backupFile);
checks.push({
  name: 'purgeBackup removes backup file',
  pass: purged && !existsSync(backupFile),
  evidence: `purged=${purged}, fileExists=${existsSync(backupFile)}`,
});

// Test 7: purgeBackup on non-existent file returns false
const purgeNonExistent = purgeBackup(join(tmpDir, 'nonexistent.json'));
checks.push({
  name: 'purgeBackup on non-existent file returns false',
  pass: purgeNonExistent === false,
  evidence: `result=${purgeNonExistent}`,
});

// Cleanup
rmSync(tmpDir, { recursive: true, force: true });

const allPass = checks.every(c => c.pass);
const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D8-1',
  why: allPass
    ? `All ${checks.length} MCP config backup read/write operations verified: save, read, take (consume), multi-agent coexist, purge. Uses temp file, no real config touched.`
    : `Failed checks: ${JSON.stringify(checks.filter(c => !c.pass))}`,
  executedAt: '20260930103000',
  details: checks,
};

console.log(JSON.stringify(output, null, 2));