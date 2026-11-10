// D3-S7 真云脚本探针
import { callTool } from 'file:///C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-aa791fe63935/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
const p = await callTool('huaweicloud_plan_cli_command', { args: ['VPC','DeleteVpc','--vpc_id=x','--cli-region=cn-north-4'] }); console.log(JSON.stringify(p.classification));
