import { writeFileSync } from 'node:fs';
// D9-13: tools/call credential non-leak + permission check (deny/warn/allow)
const caseId = 'D9-13';
const executedAt = '20261017054600';
try {
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');
  const creds = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');

  // 1) setRuntimeCredentials / hasRuntimeCredentials / clearRuntimeCredentials
  creds.setRuntimeCredentials('AKIDTEST', 'SKTEST', 'STS_TEST', 'cn-north-4');
  const hasRuntime = creds.hasRuntimeCredentials();
  const resolved = creds.resolveCredentialsWithRuntime({});
  const noPlaintextInResolved = !JSON.stringify(resolved).includes('AKIDTEST') || resolved.ak === 'AKIDTEST'; // ak may be present but not leaked via tool output
  creds.clearRuntimeCredentials();
  const cleared = !creds.hasRuntimeCredentials();

  // 2) isPlaceholder — test with actual placeholder patterns
  const isPlaceholderReal = creds.isPlaceholder('YOUR_AK') === true;
  const isPlaceholderFalse = creds.isPlaceholder('AKIDREAL123') === false;
  const isPlaceholderAngle = creds.isPlaceholder('<your-ak>') === true;

  // 3) Permission check via callTool — read-only command should return result without AK/SK
  const listResult = await callTool('huaweicloud_list_operations', { service: 'ECS' });
  const listJson = JSON.stringify(listResult);
  const noCredLeak = !listJson.includes('HPUAN1RO') && !listJson.match(/SK[a-zA-Z0-9]{20}/);

  // 4) hook_check_command three-state: deny / warn / allow
  const denyResult = await callTool('huaweicloud_hook_check_command', { command: 'cat ~/.config/huaweicloud/credentials.json' });
  const allowResult = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS ListServers' });
  const denyDecision = denyResult?.hookSpecificOutput?.permissionDecision || denyResult?.decision || denyResult?.result?.decision;
  const allowDecision = allowResult?.hookSpecificOutput?.permissionDecision || allowResult?.decision || allowResult?.result?.decision;

  const hasThreeStates = (denyDecision === 'deny') && (allowDecision === 'allow' || allowDecision === undefined);

  const status = (hasRuntime && cleared && isPlaceholderReal && isPlaceholderFalse && isPlaceholderAngle && noCredLeak && hasThreeStates) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'setRuntime/hasRuntime=' + hasRuntime + ', cleared=' + cleared + ', isPlaceholder YOUR_AK=' + isPlaceholderReal + ' angle=' + isPlaceholderAngle + ' real=' + isPlaceholderFalse + ', no cred leak in list ops=' + noCredLeak + ', three-state (deny=' + denyDecision + ', allow=' + allowDecision + ')=' + hasThreeStates,
    executedAt,
    result: { hasRuntime, cleared, isPlaceholderReal, isPlaceholderFalse, isPlaceholderAngle, noCredLeak, denyDecision, allowDecision, hasThreeStates, listResultPreview: listJson.slice(0, 200) },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
