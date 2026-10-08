// D1-41: check_update真实MCP返回契约
// Call handleCheckUpdate (via callTool) with mock doQuery, verify contract fields
import { pathToFileURL } from 'node:url';
const { callTool } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);

// Use a mock doQuery that returns known dist-tags
const mockQuery = async () => ({ latest: '1.1.8', next: '1.1.9-next.0' });

try {
  const result = await callTool('huaweicloud_check_update', {}, { doQuery: mockQuery });

  // Verify contract: must have currentVersion, latestStable, latestNext, targetVersion,
  // updateAvailable, dismissed, dismissExpiresAt, result
  const requiredFields = ['currentVersion', 'latestStable', 'latestNext', 'targetVersion',
    'updateAvailable', 'dismissed', 'dismissExpiresAt', 'result'];
  const missingFields = requiredFields.filter(f => !(f in result));
  const hasAllFields = missingFields.length === 0;
  const validResult = ['up_to_date', 'update_available', 'dismissed', 'check_failed'].includes(result.result);
  const validBooleans = typeof result.updateAvailable === 'boolean' && typeof result.dismissed === 'boolean';

  const pass = hasAllFields && validResult && validBooleans;
  const output = {
    status: pass ? 'PASS' : 'FAIL',
    caseId: 'D1-41',
    why: pass
      ? `check_update returned valid contract: result=${result.result}, all ${requiredFields.length} fields present, booleans valid`
      : `missing fields: ${missingFields.join(',')}, validResult=${validResult}, validBooleans=${validBooleans}`,
    executedAt: '20261001103000',
    detail: result,
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  const output = {
    status: 'FAIL',
    caseId: 'D1-41',
    why: `check_update threw error: ${error.message}`,
    executedAt: '20261001103000',
    detail: { error: error.message },
  };
  console.log(JSON.stringify(output, null, 2));
}