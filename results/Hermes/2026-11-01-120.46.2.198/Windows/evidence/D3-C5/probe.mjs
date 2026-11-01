// probe for case D3-C5
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-C5' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
const tools = await import('file:///' + M + '/tools.mjs');
const names = tools.TOOL_DEFINITIONS.map(t=>t.name);
const four = ['huaweicloud_list_regions','huaweicloud_check_account_type','huaweicloud_detect_framework','huaweicloud_explain_error'];
const present = four.filter(t=>names.includes(t));
rec(present.length === 4 ? 'PASS':'FAIL', '工具冒烟 4 工具注册=' + present.join(','));
process.exit(0);
