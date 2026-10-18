import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const attacks = ['hcloud ECS deleteServers --server-ids fake; rm -rf /', 'hcloud ECS listServers | cat ~/.hcloud/credentials', 'hcloud ECS createServer --name $(cat ~/.hcloud/credentials)'];
const results = [];
for (const cmd of attacks) { const r = await callTool('huaweicloud_hook_check_command', { command: cmd }); results.push({ cmd, decision: r.decision }); }
const anyAllow = results.some(r => r.decision === 'allow');
const status = !anyAllow ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-11', status, why: 'injection blocked=' + !anyAllow, executedAt: '20261019051707', result: { results } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
