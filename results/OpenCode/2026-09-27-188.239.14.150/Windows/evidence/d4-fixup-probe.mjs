import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EVIDENCE_BASE = __dirname;
const HDK_SRC = 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src';

const now = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

function saveEvidence(caseId, probeContent, result) {
  const dir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.txt'), probeContent);
  writeFileSync(join(dir, 'stdout.log'), typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  console.log(`[${caseId}] ${result.status || 'unknown'}`);
}

const { classifyTextCommand } = await import(`file://${HDK_SRC}/safety-policy.mjs`);

// ===== D4-2: Credential env print interception (P0) =====
// Test scope: printenv/echo of Huawei Cloud credential env vars
try {
  const testCmds = [
    'printenv HW_ACCESS_KEY',
    'printenv HUAWEICLOUD_SECRET_ACCESS_KEY',
    'echo $HW_SECRET_KEY',
    'echo $HUAWEICLOUD_ACCESS_KEY',
    'echo $HW_SECURITY_TOKEN',
  ];
  let allBlocked = true;
  const results = [];
  for (const cmd of testCmds) {
    const result = classifyTextCommand(cmd);
    results.push({ cmd, decision: result.decision, reason: result.reason });
    if (result.decision !== 'deny') allBlocked = false;
  }
  saveEvidence('D4-2', `Credential env print interception (OpenCode non-hook):
Test scope: printenv/echo of Huawei Cloud credential env vars (HW_*/HUAWEICLOUD_* prefix).

${results.map(r => `  ${r.cmd} => ${r.decision} (${r.reason})`).join('\n')}

All credential env print commands blocked: ${allBlocked}`, {
    status: allBlocked ? 'PASS' : 'FAIL',
    why: allBlocked ? 
      `OpenCode (non-hook): classifyTextCommand blocks all printenv/echo of Huawei Cloud credential env vars (HW_ACCESS_KEY, HW_SECRET_KEY, HW_SECURITY_TOKEN, HUAWEICLOUD_ACCESS_KEY, HUAWEICLOUD_SECRET_ACCESS_KEY). MCP-level risk identification effective.`
      : 'Some commands not blocked',
    clientType: 'non-hook',
    results,
    executedAt: now()
  });
} catch(e) {
  saveEvidence('D4-2', `Error: ${e.message}`, { status: 'FAIL', why: e.message, executedAt: now() });
}

// ===== D4-16: Command wrapping penetration (P0) =====
// Test: concatenated commands and pipe-separated write commands
// Source fix #650: findHcloudCommandSegments splits by ||, &&, ;, | and detects write commands
try {
  const testCmds = [
    // Concatenated commands - write command after read command
    'hcloud ECS ListServersDetails; hcloud ECS DeleteServer --instance_id=xxx',
    // Pipe-separated
    'hcloud ECS ListServersDetails | hcloud ECS DeleteServer --instance_id=xxx',
    // && separated
    'hcloud ECS ListServersDetails && hcloud ECS DeleteServer --instance_id=xxx',
    // || separated  
    'hcloud ECS ListServersDetails || hcloud VPC DeleteVpc --vpc_id=xxx',
    // Credential file access in wrapper (detected via text-level patterns)
    'sh -c "cat ~/.config/huaweicloud/credentials.json"',
  ];
  let allBlocked = true;
  const results = [];
  for (const cmd of testCmds) {
    const result = classifyTextCommand(cmd);
    results.push({ cmd, decision: result.decision, reason: result.reason });
    if (result.decision !== 'deny') allBlocked = false;
  }
  saveEvidence('D4-16', `Command wrapping penetration (OpenCode non-hook):
Test: concatenated/pipe-separated write commands + credential access in wrappers.
Source fix #650: findHcloudCommandSegments splits by ||, &&, ;, | and detects hcloud write commands.

${results.map(r => `  ${r.cmd.substring(0, 60)} => ${r.decision}`).join('\n')}

All wrapped/concatenated write commands blocked: ${allBlocked}

Source ref: safety-policy.mjs:71 "wrapped write commands keep their deny classification (#650 D4-16)"
findHcloudCommandSegments (line 156) splits by shell operators and detects hcloud write commands.`, {
    status: allBlocked ? 'PASS' : 'FAIL',
    why: allBlocked ? 
      `OpenCode (non-hook): classifyTextCommand detects write commands (DeleteServer, DeleteVpc) in concatenated strings (split by ;, |, &&, ||) and credential file access in shell wrappers. Inner command detection works per #650 fix.`
      : 'Some wrapped commands not blocked',
    clientType: 'non-hook',
    results,
    sourceRef: 'safety-policy.mjs:71,156 - #650 D4-16 fix',
    executedAt: now()
  });
} catch(e) {
  saveEvidence('D4-16', `Error: ${e.message}`, { status: 'FAIL', why: e.message, executedAt: now() });
}

console.log('\n=== D4-2/D4-16 Fixup Complete ===');
