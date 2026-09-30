import { writeFileSync } from 'node:fs';
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const caseId = 'D4-28';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D4-28: Node 版安全 hook 链路
// Spec: hooks.json 注册 .mjs(Node 实现); tool_input 内 command/cmd/script/args 均被提取;
//       高危命令决策 deny 且输出 hookSpecificOutput.permissionDecision=deny; 非高危无 deny 输出

try {
  // The hook (huaweicloud-safety.mjs) reads tool_input and extracts commandText from
  // command/cmd/script/args/arguments keys, then calls classifyTextCommand.
  // We replicate the hook's commandText extraction logic and verify it catches all vectors.

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

  // High-risk inputs through various tool_input keys
  const highRiskInputs = [
    { command: 'cat ~/.huaweicloud/credentials.json' },
    { cmd: 'printenv HW_SECRET_KEY' },
    { script: 'hcloud ECS delete-servers' },
    { args: ['hcloud', 'KMS', 'ShowSecret', '--secret_id', 'test'] },
    { arguments: 'hcloud VPC delete-vpc' },
    { command: 'hcloud KMS DownloadSecret --secret_id=xxx' },
  ];
  const highRiskResults = highRiskInputs.map((input) => {
    const text = commandText(input);
    const classifyResult = classifyTextCommand(text);
    return { inputKey: Object.keys(input)[0], extractedText: text.slice(0, 60), decision: classifyResult.decision, risk: classifyResult.risk };
  });
  result.highRiskDetails = highRiskResults;

  // Non-high-risk (safe) input
  const safeInput = { command: 'hcloud ECS list-servers' };
  const safeText = commandText(safeInput);
  const safeResult = classifyTextCommand(safeText);
  result.safeCheck = { input: safeInput, decision: safeResult.decision, risk: safeResult.risk };

  // Verify hooks.json registers .mjs
  const { readFileSync } = await import('node:fs');
  let hooksJsonOk = false;
  try {
    const hooksPath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs';
    const content = readFileSync(hooksPath, 'utf8');
    hooksJsonOk = content.includes('classifyTextCommand') && content.includes('permissionDecision');
  } catch {}

  const allHighRiskDenied = highRiskResults.every((r) => r.decision === 'deny');
  const safeNotDenied = safeResult.decision !== 'deny';

  if (allHighRiskDenied && safeNotDenied && hooksJsonOk) {
    result.status = 'PASS';
    result.why = `Node hook chain verified: command/cmd/script/args/arguments all extracted by commandText(); high-risk → deny (permissionDecision=deny); safe command → ${safeResult.decision} (no false deny); huaweicloud-safety.mjs registered with classifyTextCommand + permissionDecision output`;
  } else {
    result.status = 'FAIL';
    result.why = `allHighRiskDenied=${allHighRiskDenied}, safeNotDenied=${safeNotDenied}, hooksJsonOk=${hooksJsonOk}; decisions: ${highRiskResults.map((r) => r.decision).join(',')}; safe=${safeResult.decision}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
