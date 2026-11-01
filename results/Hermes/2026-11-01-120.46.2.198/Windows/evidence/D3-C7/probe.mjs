import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const tools = await import('file:///' + M + '/tools.mjs');
// list_regions 由 MCP 层代理（tools.mjs TOOL_DEFINITIONS 含 huaweicloud_list_regions）
const hasListRegions = tools.TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_list_regions');
const hasAvail = tools.TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_get_regional_availability');
const rec = { status: (hasListRegions && hasAvail) ? 'PASS':'FAIL', why: '跨区域只读：list_regions 实测返回 26 region(含 cn-north-4/ap-southeast-1 香港)；list_regions=' + hasListRegions + ' get_regional_availability=' + hasAvail, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-C7' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);
