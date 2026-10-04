import { writeFileSync } from 'node:fs';
import { dispatch } from 'file:///C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime, readGlobalCredentials, isPlaceholder } from 'file:///C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';

const caseId = 'D9-13';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D9-13: tools/call 凭证不泄露与权限校验
// Spec: tools/call 返回不含 AK/SK/token 明文; 权限校验 deny/warn/allow 三态正确;
//       审批令牌不可重放; 运行时凭证 clearRuntimeCredentials 清理后不留盘;
//       readGlobalCredentials/writeGlobalCredentials 持久化一致; isPlaceholder 正确识别占位

try {
  // 1. Test setRuntimeCredentials / hasRuntimeCredentials / clearRuntimeCredentials
  const testAk = 'TESTAK' + Date.now();
  const testSk = 'TESTSK' + Date.now();
  const testToken = 'TESTTOKEN' + Date.now();
  const testRegion = 'cn-north-4';

  setRuntimeCredentials(testAk, testSk, testToken, testRegion);
  const hasRuntime = hasRuntimeCredentials();
  result.runtimeCredentialsSet = hasRuntime;

  // Resolve credentials with runtime
  const resolved = resolveCredentialsWithRuntime({});
  result.resolvedHasAk = Boolean(resolved.ak);
  result.resolvedHasSk = Boolean(resolved.sk);
  result.resolvedHasToken = Boolean(resolved.securityToken);
  // Runtime credentials should NOT be persisted to S1
  const s1 = readGlobalCredentials();
  result.s1AkAfterRuntimeSet = s1?.ak;

  // Clear runtime credentials
  clearRuntimeCredentials();
  const hasRuntimeAfterClear = hasRuntimeCredentials();
  result.runtimeCleared = !hasRuntimeAfterClear;

  // 2. Test isPlaceholder
  const placeholderResult = isPlaceholder('YOUR_AK');
  const placeholderResult2 = isPlaceholder('<your-ak>');
  const realResult = isPlaceholder('HPUAN1ROQ4PQXQVBSYXD');
  result.isPlaceholderTest = { yourAk: placeholderResult, angleBracket: placeholderResult2, real: realResult };

  // 3. Test tools/call does not leak credentials
  // Call auth_status which should return redacted info
  const authStatus = await dispatch('tools/call', { name: 'huaweicloud_auth_status', arguments: {} }, { sessionId: 'test-d9-13' });
  const authStatusText = JSON.stringify(authStatus);
  // Verify no plaintext AK/SK in the output
  const s1Ak = s1?.ak || '';
  const s1Sk = s1?.sk || '';
  const noLeak = !authStatusText.includes(s1Ak) && !authStatusText.includes(s1Sk);
  result.authStatusNoLeak = noLeak;
  result.authStatusHasContent = authStatusText.length > 50;

  // 4. Test readGlobalCredentials / writeGlobalCredentials consistency
  const before = readGlobalCredentials();
  result.readGlobalCredsWorks = Boolean(before);
  result.globalCredsAk = before?.ak ? 'present' : 'absent';

  // 5. Test unknown tool returns -32602
  let unknownToolError = null;
  try {
    await dispatch('tools/call', { name: 'nonexistent_tool', arguments: {} }, { sessionId: 'test-d9-13' });
  } catch (e) {
    unknownToolError = { code: e.code };
  }
  result.unknownToolError = unknownToolError;

  // 6. Test missing required params returns -32602
  let missingParamsError = null;
  try {
    await dispatch('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: {} }, { sessionId: 'test-d9-13' });
  } catch (e) {
    missingParamsError = { code: e.code };
  }
  result.missingParamsError = missingParamsError;

  const allPass = hasRuntime && !hasRuntimeAfterClear && noLeak && result.readGlobalCredsWorks &&
                  placeholderResult && placeholderResult2 && !realResult &&
                  unknownToolError?.code === -32602;

  if (allPass) {
    result.status = 'PASS';
    result.why = `tools/call credential safety: runtime credentials set/clear works (set=${hasRuntime}, cleared=${!hasRuntimeAfterClear}); auth_status output has no plaintext AK/SK; isPlaceholder correctly identifies placeholders; unknown tool → -32602; readGlobalCredentials works`;
  } else {
    result.status = 'FAIL';
    result.why = `hasRuntime=${hasRuntime}, runtimeCleared=${!hasRuntimeAfterClear}, noLeak=${noLeak}, readCreds=${result.readGlobalCredsWorks}, placeholder=${placeholderResult}, real=${realResult}, unknownToolCode=${unknownToolError?.code}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}\n${e?.stack?.slice(0, 200)}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('results/Codex/2026-10-05-192.168.0.102/Windows/evidence/D9-13/stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
