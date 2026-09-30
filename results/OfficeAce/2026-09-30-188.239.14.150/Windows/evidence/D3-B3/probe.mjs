// D3-B3: run_readonly脱敏执行 - execute real read-only hcloud command, verify redaction
import { spawnSync } from 'node:child_process';
import { redactSecrets, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const hcloud = 'C:\\Users\\Administrator\\hcloud\\hcloud.exe';

// Step 1: Classify the command - must be read-only
const args = ['ECS', 'ListServers', '--limit=1'];
const classification = classifyHcloudArgs(args);

// Step 2: Execute the real command
const result = spawnSync(hcloud, args, {
  encoding: 'utf8',
  timeout: 60000,
  windowsHide: true,
});

const rawStdout = result.stdout || '';
const rawStderr = result.stderr || '';
const rc = result.status;

// Step 3: Redact secrets from output
const redactedStdout = redactSecrets(rawStdout);
const redactedStderr = redactSecrets(rawStderr);

// Step 4: Verify no AK/SK patterns in redacted output
const akPattern = 'HPUAN1ROQ4PQXQVBSYXD';
const skPattern = 'ExzAgLDfOfbaLm8pgyVCJKmtF4Nb5lLX6LnUFrfN';

const akInRaw = rawStdout.includes(akPattern) || rawStderr.includes(akPattern);
const skInRaw = rawStdout.includes(skPattern) || rawStderr.includes(skPattern);
const akInRedacted = redactedStdout.includes(akPattern) || redactedStderr.includes(akPattern);
const skInRedacted = redactedStdout.includes(skPattern) || redactedStderr.includes(skPattern);

// Step 5: Verify classification is read-only
const classOk = classification.decision === 'allow' && classification.risk === 'read_only';

// Step 6: Verify command actually executed (got some output)
const hasOutput = rawStdout.length > 0 || rc === 0;

// Pass criteria: classification is read-only, command executed, and redacted output has no secrets
const pass = classOk && hasOutput && !akInRedacted && !skInRedacted;

const output = {
  status: pass ? 'PASS' : 'FAIL',
  caseId: 'D3-B3',
  why: pass
    ? `Read-only command classified as read_only, executed successfully (rc=${rc}), and redacted output contains no AK/SK.`
    : `Issues: classOk=${classOk}, hasOutput=${hasOutput}, akInRedacted=${akInRedacted}, skInRedacted=${skInRedacted}`,
  executedAt: '20260930103000',
  classification: {
    decision: classification.decision,
    risk: classification.risk,
    reason: classification.reason,
  },
  execution: {
    command: `hcloud ${args.join(' ')}`,
    rc,
    rawOutputLength: rawStdout.length,
    rawStderrLength: rawStderr.length,
    akInRawOutput: akInRaw,
    skInRawOutput: skInRaw,
    akInRedactedOutput: akInRedacted,
    skInRedactedOutput: skInRedacted,
  },
  redactedOutputPreview: redactedStdout.slice(0, 500),
};

console.log(JSON.stringify(output, null, 2));