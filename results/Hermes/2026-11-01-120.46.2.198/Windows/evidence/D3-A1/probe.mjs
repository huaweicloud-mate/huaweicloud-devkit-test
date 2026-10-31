// probe for case D3-A1
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-A1' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
import { readdirSync, existsSync } from 'node:fs';
const tools = await import('file:///' + M + '/tools.mjs');
const skillsRoot = PKG + '/plugins/huaweicloud-core/skills';
const skills = existsSync(skillsRoot) ? readdirSync(skillsRoot).filter(d=>!d.startsWith('.')) : [];
const names = tools.TOOL_DEFINITIONS.map(t=>t.name);
rec((skills.length > 0 && names.includes('huaweicloud_retrieve_skill')) ? 'PASS':'FAIL', 'skills dir count=' + skills.length + ' retrieve_skill registered=' + names.includes('huaweicloud_retrieve_skill'));
process.exit(0);
