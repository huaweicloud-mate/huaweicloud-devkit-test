// D1-45: 兜底提示真实序列
// When query fails (returns null), check_update should return check_failed with note
import { pathToFileURL } from 'node:url';
const { callTool } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const { invalidateUpdateCache } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs').href);

// Mock query that fails (returns null)
const failQuery = async () => null;

try {
  invalidateUpdateCache();
  const result = await callTool('huaweicloud_check_update', {}, { doQuery: failQuery });

  // When query fails, should get check_failed result with note
  const isCheckFailed = result.result === 'check_failed';
  const hasNote = typeof result.note === 'string' && result.note.length > 0;
  const hasCurrentVersion = typeof result.currentVersion === 'string';
  const notUpdateAvailable = result.updateAvailable === false;

  const pass = isCheckFailed && hasNote && hasCurrentVersion && notUpdateAvailable;
  const output = {
    status: pass ? 'PASS' : 'FAIL',
    caseId: 'D1-45',
    why: pass
      ? `query failed -> result=check_failed, note="${result.note}", updateAvailable=false, currentVersion=${result.currentVersion}`
      : `isCheckFailed=${isCheckFailed}, hasNote=${hasNote}, hasCurrentVersion=${hasCurrentVersion}, notUpdateAvailable=${notUpdateAvailable}`,
    executedAt: '20261001103000',
    detail: result,
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  const output = {
    status: 'FAIL',
    caseId: 'D1-45',
    why: `fallback test threw error: ${error.message}`,
    executedAt: '20261001103000',
    detail: { error: error.message },
  };
  console.log(JSON.stringify(output, null, 2));
}