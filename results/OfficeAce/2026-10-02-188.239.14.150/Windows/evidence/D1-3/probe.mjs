// D1-3: doctor健康自检 - run huaweicloud_check_cli tool (doctor equivalent)
import { pathToFileURL } from 'node:url';
const { callTool } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);

try {
  const result = await callTool('huaweicloud_check_cli', {});
  // doctor should return structured result with installed, authenticated, status fields
  const hasFields = typeof result === 'object' && result !== null &&
                    'installed' in result && 'status' in result;
  const pass = hasFields;
  const output = {
    status: pass ? 'PASS' : 'FAIL',
    caseId: 'D1-3',
    why: pass
      ? `doctor returned structured result: installed=${result.installed}, status=${result.status}, versionMismatch=${result.versionMismatch}`
      : `doctor did not return expected fields. Got: ${JSON.stringify(result).slice(0, 200)}`,
    executedAt: '20261001103000',
    detail: { installed: result.installed, status: result.status, versionMismatch: result.versionMismatch, installedVersion: result.installedVersion, kooCliVersion: result.kooCliVersion },
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  const output = {
    status: 'FAIL',
    caseId: 'D1-3',
    why: `doctor threw error: ${error.message}`,
    executedAt: '20261001103000',
    detail: { error: error.message, code: error.code },
  };
  console.log(JSON.stringify(output, null, 2));
}