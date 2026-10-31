// probe for case D3-C6
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-C6' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const tools = await import('file:///' + M + '/tools.mjs');
const names = tools.TOOL_DEFINITIONS.map(t=>t.name);
const sandbox = ['huaweicloud_sandbox_check_user','huaweicloud_sandbox_credentials','huaweicloud_sandbox_sign_agreement','huaweicloud_sandbox_exec_one_shot','huaweicloud_sandbox_upload_file','huaweicloud_sandbox_close_session','huaweicloud_sandbox_deploy_check'];
const present = sandbox.filter(t=>names.includes(t));
rec(present.length === 7 ? 'PASS':'FAIL', '沙箱 7 隐式工具具名注册=' + present.length + '/7 缺失=' + sandbox.filter(t=>!names.includes(t)).join(','));
process.exit(0);
