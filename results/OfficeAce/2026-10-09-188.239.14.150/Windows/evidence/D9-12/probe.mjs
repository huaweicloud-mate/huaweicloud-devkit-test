/**
 * D9-12: MCP protocol JSON-RPC 2.0 compliance
 * initialize must return protocolVersion, capabilities, serverInfo
 * Error codes must follow JSON-RPC 2.0 spec
 */
import { dispatch } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-09-188.239.14.150/Windows/evidence/D9-12';
mkdirSync(evDir, { recursive: true });
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail: String(detail).substring(0, 200) }); }

// 1. initialize returns proper structure
const initResult = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'test', version: '1.0' } });
check('init-returns-object', initResult && typeof initResult === 'object', `type=${typeof initResult}`);
check('init-protocolVersion', typeof initResult.protocolVersion === 'string', `protocolVersion=${initResult.protocolVersion}`);
check('init-capabilities', initResult.capabilities && typeof initResult.capabilities === 'object', `capabilities=${JSON.stringify(initResult.capabilities)}`);
check('init-serverInfo', initResult.serverInfo && typeof initResult.serverInfo === 'object', `serverInfo=${JSON.stringify(initResult.serverInfo)}`);
check('init-server-name', initResult.serverInfo?.name === 'huaweicloud-devkit', `name=${initResult.serverInfo?.name}`);
check('init-server-version', typeof initResult.serverInfo?.version === 'string' && initResult.serverInfo.version.length > 0, `version=${initResult.serverInfo?.version}`);

// 2. tools/list returns tools array
const listResult = await dispatch('tools/list', {});
check('tools-list-returns-array', listResult && Array.isArray(listResult.tools), `type=${typeof listResult?.tools}`);

// 3. resources/list returns empty array
const resResult = await dispatch('resources/list', {});
check('resources-list', resResult && Array.isArray(resResult.resources), `resources=${JSON.stringify(resResult)}`);

// 4. Unknown method throws with -32601 (Method not found)
try {
  await dispatch('unknown/method', {});
  check('unknown-method-throws', false, 'did not throw');
} catch (e) {
  check('unknown-method-throws', true, `threw: ${e.message}`);
  check('unknown-method-code', e.code === -32601, `code=${e.code}`);
}

// 5. Unknown tool throws with -32602 (Invalid params)
try {
  await dispatch('tools/call', { name: 'nonexistent_tool', arguments: {} });
  check('unknown-tool-throws', false, 'did not throw');
} catch (e) {
  check('unknown-tool-throws', true, `threw: ${e.message}`);
  check('unknown-tool-code', e.code === -32602, `code=${e.code}`);
}

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({ status: allPass ? 'PASS' : 'FAIL', caseId: 'D9-12', why: allPass ? 'MCP protocol compliant with JSON-RPC 2.0' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`, executedAt: '20261001103000', checks }, null, 2);
writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);