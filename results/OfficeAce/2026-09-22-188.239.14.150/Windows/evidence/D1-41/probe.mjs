// AI生成
// D1-41: check_update真实MCP返回契约 (install默认目标)
// Start real mcp-server, initialize→tools/call(check_update), parse content JSON
import { dispatch } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const results = {};

try {
  // Step 1: initialize
  const initResult = await dispatch('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe-d141', version: '1.0.0' }
  }, { sessionId: 'test-d141' });
  results.initOk = !!initResult;

  // Step 2: tools/call check_update
  const callResult = await dispatch('tools/call', {
    name: 'huaweicloud_check_update',
    arguments: {}
  }, { sessionId: 'test-d141' });
  
  results.callResult = callResult;
  results.isError = callResult?.isError === true;
  
  // Step 3: Parse content JSON
  let parsed = null;
  if (callResult?.content?.[0]?.text) {
    try {
      parsed = JSON.parse(callResult.content[0].text);
      results.parsed = parsed;
    } catch (e) {
      results.parseError = e.message;
    }
  }
  
  // Step 4: Check contract fields
  if (parsed) {
    results.hasResult = !!parsed.result;
    results.hasCurrentVersion = !!parsed.currentVersion;
    results.hasUpdateAvailable = typeof parsed.updateAvailable === 'boolean';
    results.hasDismissed = typeof parsed.dismissed === 'boolean';
    results.validResult = ['up_to_date', 'update_available', 'dismissed', 'check_failed'].includes(parsed.result);
  }
  
  const status = (results.initOk && !results.isError && results.hasResult && 
                  results.hasCurrentVersion && results.hasUpdateAvailable && results.validResult) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? `MCP check_update返回契约正确: isError=false, result=${parsed?.result}, currentVersion=${parsed?.currentVersion}, updateAvailable=${parsed?.updateAvailable}`
      : `MCP返回契约异常: initOk=${results.initOk}, isError=${results.isError}, hasResult=${results.hasResult}, validResult=${results.validResult}`,
    executedAt: ts(),
    ...results
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
