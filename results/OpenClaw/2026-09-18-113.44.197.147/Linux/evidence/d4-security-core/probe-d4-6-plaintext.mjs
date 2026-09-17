import { callTool } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';
// 空格形式 --adminPass xxx 完整返回
const r = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--adminPass', 'Secret123', '--server.flavorRef=f'] });
console.log('decision:', JSON.stringify(r?.classification?.decision));
console.log('warnings:', JSON.stringify(r?.warnings));
console.log('args contains Secret123:', r?.args?.includes('Secret123'));
console.log('args has redacted:', r?.args?.some(a=>String(a).includes('<redacted>')));
console.log('args:', JSON.stringify(r?.args));
