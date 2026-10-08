// D4-20: 拒绝后零操作
// auth_confirm with decision=s1 should leave credentials unchanged
import { pathToFileURL } from 'node:url';
const { callTool } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const { readGlobalCredentials, globalCredentialsPath, clearRuntimeCredentials } =
  await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);
import { readFileSync, existsSync } from 'node:fs';

try {
  // Read existing credentials before
  const credPath = globalCredentialsPath();
  const beforeContent = existsSync(credPath) ? readFileSync(credPath, 'utf8') : null;

  // Trigger a conflict: auth_switch persist with different AK
  const conflictAk = 'CONFLICTAKD4X20REJECT';
  const conflictSk = 'CONFLICTSKD4X20REJECTSECRETKEYVALUE42';
  const switchResult = await callTool('huaweicloud_auth_switch', {
    mode: 'memory',
    action: 'persist',
    ak: conflictAk,
    sk: conflictSk,
    region: 'cn-north-4',
  });

  // Should get needs_confirmation with a token
  const hasToken = switchResult.status === 'needs_confirmation' && switchResult.confirmToken;

  if (!hasToken) {
    clearRuntimeCredentials();
    console.log(JSON.stringify({
      status: 'FAIL',
      caseId: 'D4-20',
      why: `Expected needs_confirmation, got status=${switchResult.status}`,
      executedAt: '20261001103000',
      detail: switchResult,
    }, null, 2));
  } else {
    // Read credentials BEFORE confirm
    const beforeConfirm = existsSync(credPath) ? readFileSync(credPath, 'utf8') : null;

    // Reject: call auth_confirm with decision=s1
    const confirmResult = await callTool('huaweicloud_auth_confirm', {
      token: switchResult.confirmToken,
      decision: 's1',
    });

    // Read credentials AFTER confirm
    const afterConfirm = existsSync(credPath) ? readFileSync(credPath, 'utf8') : null;

    // Credentials should be unchanged
    const unchanged = beforeContent === afterConfirm;
    const aborted = confirmResult.status === 'ok' && confirmResult.outcome === 'aborted';

    clearRuntimeCredentials();

    const pass = unchanged && aborted;
    console.log(JSON.stringify({
      status: pass ? 'PASS' : 'FAIL',
      caseId: 'D4-20',
      why: pass
        ? `auth_confirm(decision=s1) returned aborted, credentials unchanged (零操作)`
        : `unchanged=${unchanged}, aborted=${aborted}, confirmStatus=${confirmResult.status}`,
      executedAt: '20261001103000',
      detail: { switchResult: { status: switchResult.status, hasToken }, confirmResult, unchanged },
    }, null, 2));
  }
} catch (error) {
  clearRuntimeCredentials();
  console.log(JSON.stringify({
    status: 'FAIL',
    caseId: 'D4-20',
    why: `test threw error: ${error.message}`,
    executedAt: '20261001103000',
    detail: { error: error.message },
  }, null, 2));
}