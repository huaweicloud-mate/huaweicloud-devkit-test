// D1-42: dismiss真实闭环
// Call check_update with dismiss=true, verify skip state is written and subsequent check returns dismissed
import { pathToFileURL } from 'node:url';
const { callTool } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const { readSkipState, resolveSkipFilePath, invalidateUpdateCache } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs').href);
import { existsSync } from 'node:fs';

const mockQuery = async () => ({ latest: '1.1.8', next: null });

try {
  invalidateUpdateCache();
  // Step 1: Call check_update with dismiss=true
  const dismissResult = await callTool('huaweicloud_check_update', { dismiss: true }, { doQuery: mockQuery });

  // Step 2: Verify skip state file was written
  const skipFile = resolveSkipFilePath(null);
  const skipExists = existsSync(skipFile);
  const skipState = readSkipState(skipFile);

  // Step 3: Call check_update again (without dismiss) - should return dismissed
  invalidateUpdateCache();
  const checkResult = await callTool('huaweicloud_check_update', {}, { doQuery: mockQuery });

  const pass = skipExists && skipState !== null &&
               skipState.dismissedVersion === '1.1.8' &&
               dismissResult.dismissed === true &&
               checkResult.result === 'dismissed';

  const output = {
    status: pass ? 'PASS' : 'FAIL',
    caseId: 'D1-42',
    why: pass
      ? `dismiss wrote skip file (${skipFile}), skipState.dismissedVersion=${skipState.dismissedVersion}, subsequent check=dismissed`
      : `skipExists=${skipExists}, skipState=${JSON.stringify(skipState)}, dismissResult.dismissed=${dismissResult.dismissed}, checkResult.result=${checkResult.result}`,
    executedAt: '20261001103000',
    detail: { dismissResult, skipFile, skipState, checkResult },
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  const output = {
    status: 'FAIL',
    caseId: 'D1-42',
    why: `dismiss test threw error: ${error.message}`,
    executedAt: '20261001103000',
    detail: { error: error.message },
  };
  console.log(JSON.stringify(output, null, 2));
}