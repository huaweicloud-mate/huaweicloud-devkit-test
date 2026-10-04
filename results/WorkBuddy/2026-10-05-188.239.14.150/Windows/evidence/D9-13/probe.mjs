import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
let status = 'PASS', why = '', evidence = {};
try {
  // D9-13: tools/call 凭证不泄露与权限校验
  const auth = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/auth/credentials.mjs');
  const proto = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');
  const safety = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/safety-policy.mjs');
  // 1) setRuntimeCredentials + hasRuntimeCredentials
  auth.setRuntimeCredentials('AKTEST', 'SKTEST', undefined, 'cn-north-4');
  const hasCreds = auth.hasRuntimeCredentials();
  evidence.hasRuntimeCredentials = hasCreds;
  // 2) resolveCredentialsWithRuntime
  const resolved = auth.resolveCredentialsWithRuntime({});
  evidence.resolvedAkPresent = !!resolved.ak;
  evidence.resolvedSkPresent = !!resolved.sk;
  // 3) loadPolicy + classifyHcloudArgs
  const policy = safety.loadPolicy();
  evidence.policyLoaded = !!policy;
  const cls = safety.classifyHcloudArgs(['ECS', 'list-servers']);
  evidence.classifyHcloudArgs = cls;
  // 4) callTool 返回不含 AK/SK 明文 — 用 show_profile_redacted
  const callResult = await proto.dispatch('tools/call', { name: 'huaweicloud_show_profile_redacted', arguments: {} }, { sessionId: 'probe-d9-13' });
  const bodyText = callResult?.content?.[0]?.text || '';
  evidence.bodyHasAk = /AKTEST/.test(bodyText);
  evidence.bodyHasSk = /SKTEST/.test(bodyText);
  // 5) clearRuntimeCredentials
  auth.clearRuntimeCredentials();
  const afterClear = auth.hasRuntimeCredentials();
  evidence.afterClear = afterClear;
  if (hasCreds && resolved.ak && !evidence.bodyHasAk && !evidence.bodyHasSk && !afterClear) {
    status = 'PASS'; why = 'setRuntimeCredentials/has/resolve/clear 链路工作；callTool 返回不含 AK/SK 明文（经 redaction pipeline 脱敏）';
  } else {
    status = 'FAIL'; why = '凭证不泄露/校验链路不完整：' + JSON.stringify(evidence).slice(0,300);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D9-13', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
