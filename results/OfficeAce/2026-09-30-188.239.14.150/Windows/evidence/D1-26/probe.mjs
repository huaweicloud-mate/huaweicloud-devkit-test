// D1-26: 升级提醒工具注册 - check TOOL_DEFINITIONS includes huaweicloud_check_update and huaweicloud_upgrade
import { pathToFileURL } from 'node:url';
const { TOOL_DEFINITIONS } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);

const toolNames = TOOL_DEFINITIONS.map(t => t.name);
const hasCheckUpdate = toolNames.includes('huaweicloud_check_update');
const hasUpgrade = toolNames.includes('huaweicloud_upgrade');

const checkUpdateDef = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update');
const upgradeDef = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_upgrade');

// Verify they have proper inputSchema with dismiss/version/target properties
const hasDismissProp = checkUpdateDef?.inputSchema?.properties?.dismiss !== undefined;
const hasVersionProp = upgradeDef?.inputSchema?.properties?.version !== undefined;
const hasTargetProp = upgradeDef?.inputSchema?.properties?.target !== undefined;

const pass = hasCheckUpdate && hasUpgrade && hasDismissProp && hasVersionProp && hasTargetProp;
const output = {
  status: pass ? 'PASS' : 'FAIL',
  caseId: 'D1-26',
  why: pass
    ? `huaweicloud_check_update (with dismiss prop) and huaweicloud_upgrade (with version+target props) both registered in TOOL_DEFINITIONS`
    : `check_update=${hasCheckUpdate}, upgrade=${hasUpgrade}, dismissProp=${hasDismissProp}, versionProp=${hasVersionProp}, targetProp=${hasTargetProp}`,
  executedAt: '20260930103000',
  detail: { toolNames: toolNames.filter(n => n.includes('update') || n.includes('upgrade')) },
};
console.log(JSON.stringify(output, null, 2));