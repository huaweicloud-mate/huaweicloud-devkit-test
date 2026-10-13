// D3-C6 probe: enumerate sandbox tools + call check_user
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __d = dirname(fileURLToPath(import.meta.url));
const tools = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/tools.mjs');
const proto = await import('file:///' + "C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk" + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');
const list = await proto.dispatch('tools/list', {});
const names = (list.tools||[]).map(t=>t.name);
const r = await tools.callTool('huaweicloud_sandbox_check_user', {}).catch(e=>({__error:String(e)}));
console.log(JSON.stringify({registered:[["huaweicloud_sandbox_check_user","huaweicloud_sandbox_credentials","huaweicloud_sandbox_sign_agreement","huaweicloud_sandbox_upload_file","huaweicloud_sandbox_exec_one_shot","huaweicloud_sandbox_deploy_check","huaweicloud_sandbox_close_session"].map(n=>names.includes(n))], checkUser:r}, null, 2));
