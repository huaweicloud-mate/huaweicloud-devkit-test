import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
const r = classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"');
console.log('sh -c printenv:', r.decision);
const r2 = classifyTextCommand('sh -c hcloud ECS DeleteServer');
console.log('sh -c hcloud:', r2.decision);
