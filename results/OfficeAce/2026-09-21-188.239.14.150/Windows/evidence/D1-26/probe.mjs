// AI生成
// D1-26: 升级提醒工具注册与协议暴露
// Spawn mcp-server, initialize, tools/list, check for huaweicloud_check_update / huaweicloud_upgrade
import { dispatch } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  // Step 1: initialize
  const initResult = await dispatch('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe-d126', version: '1.0.0' }
  }, { sessionId: 'test-d126' });

  // Step 2: tools/list
  const toolsResult = await dispatch('tools/list', {}, { sessionId: 'test-d126' });
  const tools = toolsResult.tools || [];

  // Step 3: Check for huaweicloud_check_update
  const checkUpdate = tools.find(t => t.name === 'huaweicloud_check_update');
  const checkUpdateOk = !!checkUpdate && !!checkUpdate.description && !!checkUpdate.inputSchema;

  // Step 4: Check for huaweicloud_upgrade
  const upgrade = tools.find(t => t.name === 'huaweicloud_upgrade');
  const upgradeOk = !!upgrade && !!upgrade.description && !!upgrade.inputSchema;

  const status = (checkUpdateOk && upgradeOk) ? 'PASS' : 'FAIL';
  
  const result = {
    status,
    why: status === 'PASS'
      ? 'tools/list中huaweicloud_check_update和huaweicloud_upgrade均注册，含description和inputSchema'
      : `工具注册不完整: check_update=${!!checkUpdate}, upgrade=${!!upgrade}`,
    executedAt: ts(),
    totalTools: tools.length,
    checkUpdate: checkUpdate ? { name: checkUpdate.name, hasDesc: !!checkUpdate.description, hasSchema: !!checkUpdate.inputSchema, schemaType: checkUpdate.inputSchema?.type } : null,
    upgrade: upgrade ? { name: upgrade.name, hasDesc: !!upgrade.description, hasSchema: !!upgrade.inputSchema, schemaType: upgrade.inputSchema?.type } : null
  };

  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  const result = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
}
process.exit(0);
