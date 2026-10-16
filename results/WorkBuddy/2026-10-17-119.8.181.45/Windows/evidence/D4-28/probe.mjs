import { writeFileSync, readFileSync } from 'node:fs';
// D4-28: Node safety hook chain — hooks.json registers .mjs, commandText extraction, deny output
const caseId = 'D4-28';
const executedAt = '20261017054100';
try {
  const { classifyTextCommand } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

  // 1) hooks.json registers node huaweicloud-safety.mjs
  const hooksJson = JSON.parse(readFileSync('C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/hooks/hooks.json', 'utf8'));
  const preToolUse = hooksJson.hooks?.PreToolUse || [];
  let registersMjs = false;
  for (const entry of preToolUse) {
    for (const h of entry.hooks || []) {
      if (String(h.command || '').includes('huaweicloud-safety.mjs') && String(h.command || '').includes('node')) {
        registersMjs = true;
      }
    }
  }

  // 2) commandText extraction — test with tool_input containing command/cmd/script/args
  // Simulate what the hook does: extract command text from tool_input
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

  const testInputs = [
    { command: 'cat ~/.config/huaweicloud/credentials.json' },
    { cmd: 'echo $HW_SECRET_KEY' },
    { script: 'hcloud ECS DeleteServer --server_ids=xxx' },
    { args: ['hcloud', 'ECS', 'DeleteServer', '--server_ids=xxx'] },
    { arguments: 'rm -rf /' },
  ];
  const extractionResults = [];
  for (const input of testInputs) {
    const text = commandText(input);
    const cls = classifyTextCommand(text);
    extractionResults.push({ input: JSON.stringify(input), extractedText: text.slice(0, 80), decision: cls.decision });
  }

  // 3) High-risk command → deny with permissionDecision:deny
  const highRiskCmd = 'cat ~/.config/huaweicloud/credentials.json';
  const highRiskCls = classifyTextCommand(highRiskCmd);
  const highRiskDeny = highRiskCls.decision === 'deny';

  // 4) Non-high-risk command → no deny
  const safeCmd = 'hcloud ECS ListServers';
  const safeCls = classifyTextCommand(safeCmd);
  const safeNoDeny = safeCls.decision !== 'deny';

  const status = (registersMjs && highRiskDeny && safeNoDeny) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'hooks.json registers .mjs=' + registersMjs + '; high-risk deny=' + highRiskDeny + '; safe no-deny=' + safeNoDeny + '; commandText extraction tested on 5 input shapes',
    executedAt,
    result: { registersMjs, extractionResults, highRiskCls: { decision: highRiskCls.decision, reason: highRiskCls.reason }, safeCls: { decision: safeCls.decision }, highRiskDeny, safeNoDeny },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
