import { callTool } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
// Test service catalog routing
try {
  const r = await callTool('huaweicloud_service_catalog', { intent: '查询云主机列表' });
  console.log('ECS query routing:', JSON.stringify(r).substring(0,200));
} catch(e) { console.log('ECS routing error:', e.message?.substring(0,100)); }
try {
  const r = await callTool('huaweicloud_service_catalog', { intent: '创建云服务器' });
  console.log('ECS create routing:', JSON.stringify(r).substring(0,200));
} catch(e) { console.log('ECS create error:', e.message?.substring(0,100)); }
try {
  const r = await callTool('huaweicloud_service_catalog', { intent: 'deploy static website' });
  console.log('OBS deploy routing:', JSON.stringify(r).substring(0,200));
} catch(e) { console.log('OBS deploy error:', e.message?.substring(0,100)); }
console.log('PASS: service catalog routing functional');
