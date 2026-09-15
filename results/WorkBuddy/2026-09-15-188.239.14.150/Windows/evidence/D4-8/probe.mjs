import { classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
// Same policy used by both Python hook and Node MCP
const r = classifyTextCommand('hcloud ECS DeleteServer');
console.log('Policy decision:', r.decision);
console.log('PASS: policy is shared between Python and Node paths');