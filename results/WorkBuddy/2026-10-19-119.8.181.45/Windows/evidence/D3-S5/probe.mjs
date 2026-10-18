import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await callTool('huaweicloud_service_catalog', { intent: '创建一个Redis缓存实例用于会话存储' });
const hasResult = r && Object.keys(r).length > 0;
const status = hasResult ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-S5', status, why: 'service_catalog composite routing hasResult=' + !!hasResult, executedAt: '20261019051707', result: { hasResult, keys: Object.keys(r||{}).slice(0,5) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
