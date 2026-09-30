// Probe: D5-1
// Status: PASS
// Time: 20260919051107
// Detail: Tool count: 40
First 5: huaweicloud_check_cli, huaweicloud_plan_cli_command, huaweicloud_run_readonly_command, huaweicloud_list_operations, huaweicloud_run_approved_command
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const tools = m.TOOL_DEFINITIONS || m.tools || [];
console.log('Tool count: ' + tools.length);
console.log('First 5: ' + tools.slice(0,5).map(t => t.name).join(', '));