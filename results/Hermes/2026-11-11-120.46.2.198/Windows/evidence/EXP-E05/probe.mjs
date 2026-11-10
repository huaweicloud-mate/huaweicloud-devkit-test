// EXP-E05 评测路由探针（run-eval.mjs 实测）
import { callTool } from 'file:///C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-aa791fe63935/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
const r = await callTool('huaweicloud_service_catalog', { intent: '帮我查一下云主机' }); console.log(JSON.stringify(r));
