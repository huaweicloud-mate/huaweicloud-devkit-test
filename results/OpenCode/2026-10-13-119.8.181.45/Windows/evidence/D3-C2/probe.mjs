// D3-C2 probe — 真云 E2E 代表终端=Hermes（非本客户端代表，未执行全链路建删）
// requires obsutil + OBS bucket; E2E assigned to Hermes representative terminal
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __d = dirname(fileURLToPath(import.meta.url));
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const plan = await tools.callTool('huaweicloud_plan_cli_command', { command: 'hcloud ECS create-servers --image-id x --flavor-id small' }).catch(e=>({__error:String(e)}));
console.log(JSON.stringify({ plan }, null, 2));
