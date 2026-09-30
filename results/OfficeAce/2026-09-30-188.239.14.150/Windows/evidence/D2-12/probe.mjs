// D2-12: R10 runtime非空禁止落盘
// auth_init sets runtime credentials in memory only, should NOT write to global credentials file
import { pathToFileURL } from 'node:url';
const { callTool } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const { readGlobalCredentials, globalCredentialsPath, setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials } =
  await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);
import { readFileSync, existsSync } from 'node:fs';

try {
  // Read global credentials file BEFORE auth_init
  const credPath = globalCredentialsPath();
  const beforeContent = existsSync(credPath) ? readFileSync(credPath, 'utf8') : null;
  const beforeCreds = readGlobalCredentials();

  // Call auth_init with test AK/SK (runtime only)
  const testAk = 'TESTAKD2X12RUNTIME';
  const testSk = 'TESTSKD2X12RUNTIMESECRETKEYVALUE';
  const initResult = await callTool('huaweicloud_auth_init', { ak: testAk, sk: testSk, region: 'cn-north-4' });

  // Verify runtime credentials are set
  const hasRuntime = hasRuntimeCredentials();

  // Read global credentials file AFTER auth_init
  const afterContent = existsSync(credPath) ? readFileSync(credPath, 'utf8') : null;
  const afterCreds = readGlobalCredentials();

  // The global file should NOT have been modified
  const fileUnchanged = beforeContent === afterContent;
  const runtimeSet = hasRuntime && initResult.status === 'ok';

  // Cleanup: clear runtime credentials
  clearRuntimeCredentials();

  const pass = fileUnchanged && runtimeSet;
  const output = {
    status: pass ? 'PASS' : 'FAIL',
    caseId: 'D2-12',
    why: pass
      ? `auth_init set runtime creds (status=${initResult.status}), global file unchanged (R10: runtime非空禁止落盘)`
      : `fileUnchanged=${fileUnchanged}, runtimeSet=${runtimeSet}, initStatus=${initResult.status}`,
    executedAt: '20260930103000',
    detail: { initResult, fileUnchanged, runtimeSet, beforeAk: beforeCreds?.ak?.slice(0,6), afterAk: afterCreds?.ak?.slice(0,6) },
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  clearRuntimeCredentials();
  const output = {
    status: 'FAIL',
    caseId: 'D2-12',
    why: `test threw error: ${error.message}`,
    executedAt: '20260930103000',
    detail: { error: error.message },
  };
  console.log(JSON.stringify(output, null, 2));
}