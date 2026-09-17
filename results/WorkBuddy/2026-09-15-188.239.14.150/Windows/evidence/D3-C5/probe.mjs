import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
const tools = TOOL_DEFINITIONS.map(t=>t.name);
const required = ['huaweicloud_check_cli','huaweicloud_list_operations','huaweicloud_plan_cli_command','huaweicloud_explain_error'];
let allFound = true;
for (const t of required) {
  if (!tools.includes(t)) { console.log('MISSING:', t); allFound = false; }
}
if (allFound) console.log('PASS: all smoke test tools registered');
else console.log('FAIL');