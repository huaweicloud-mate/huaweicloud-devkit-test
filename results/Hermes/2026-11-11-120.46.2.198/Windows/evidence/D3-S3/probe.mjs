// D3-S3 沙箱预览探针（realcloud_e2e.mjs sandbox 真机）
import { callTool } from 'file:///C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-aa791fe63935/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
const c = await callTool('huaweicloud_sandbox_connect', {}); console.log(JSON.stringify(c).slice(0,200));
