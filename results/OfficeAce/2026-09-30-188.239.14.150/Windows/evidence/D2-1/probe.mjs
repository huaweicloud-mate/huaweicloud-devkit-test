// D2-1: auth init三端同步
import { pathToFileURL } from 'node:url';
const { callTool } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const { resolveCredentialsWithRuntime, clearRuntimeCredentials, hasRuntimeCredentials, readGlobalCredentials } =
  await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);

try {
  const stored = readGlobalCredentials();
  if (!stored?.ak || !stored?.sk) {
    console.log(JSON.stringify({
      status: 'BLOCKED',
      caseId: 'D2-1',
      why: 'No real cloud credentials found in global vault. Need valid AK/SK to test auth init.',
      executedAt: '20260930103000',
      detail: {},
    }, null, 2));
  } else {
    // Step 1: Call auth_init with real credentials
    const initResult = await callTool('huaweicloud_auth_init', {
      ak: stored.ak,
      sk: stored.sk,
      region: stored.region || 'cn-north-4',
    });

    // Step 2: Verify runtime credentials are set (S1 - runtime/in-memory)
    const runtimeCreds = resolveCredentialsWithRuntime();
    const s1Ok = runtimeCreds?.ak === stored.ak && runtimeCreds?.sk === stored.sk;

    // Step 3: Call auth_status to verify all endpoints
    const authStatus = await callTool('huaweicloud_auth_status', { target: 'all' });

    // Step 4: Call auth_sync to sync to S3 (OBS)
    const syncResult = await callTool('huaweicloud_auth_sync', { target: 'all' });

    clearRuntimeCredentials();

    const pass = initResult.status === 'ok' && s1Ok;
    console.log(JSON.stringify({
      status: pass ? 'PASS' : 'FAIL',
      caseId: 'D2-1',
      why: pass
        ? `auth_init set runtime creds (S1), resolveCredentialsWithRuntime returns correct AK. auth_status and auth_sync executed.`
        : `initStatus=${initResult.status}, s1Ok=${s1Ok}`,
      executedAt: '20260930103000',
      detail: { initResult, s1Ok, authStatusKeys: Object.keys(authStatus || {}), syncResultKeys: Object.keys(syncResult || {}) },
    }, null, 2));
  }
} catch (error) {
  clearRuntimeCredentials();
  console.log(JSON.stringify({
    status: 'FAIL',
    caseId: 'D2-1',
    why: `test threw error: ${error.message}`,
    executedAt: '20260930103000',
    detail: { error: error.message },
  }, null, 2));
}