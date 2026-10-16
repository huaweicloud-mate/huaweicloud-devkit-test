import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
// D1-26: Upgrade reminder tool registration — check_update/upgrade tools registered in MCP server
const caseId = 'D1-26';
const executedAt = '20261017061000';
try {
  const { TOOL_DEFINITIONS } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');
  const toolNames = TOOL_DEFINITIONS.map(t => t.name);
  const hasCheckUpdate = toolNames.includes('huaweicloud_check_update');
  const hasUpgrade = toolNames.includes('huaweicloud_upgrade');
  // Verify schema
  const checkUpdateTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update');
  const upgradeTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_upgrade');
  const checkUpdateHasSchema = checkUpdateTool && checkUpdateTool.description && checkUpdateTool.inputSchema;
  const upgradeHasSchema = upgradeTool && upgradeTool.description && upgradeTool.inputSchema;
  const status = (hasCheckUpdate && hasUpgrade && checkUpdateHasSchema && upgradeHasSchema) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'check_update registered=' + hasCheckUpdate + ' (schema=' + !!checkUpdateHasSchema + '); upgrade registered=' + hasUpgrade + ' (schema=' + !!upgradeHasSchema + ')', executedAt, result: { hasCheckUpdate, hasUpgrade, checkUpdateHasSchema, upgradeHasSchema } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
