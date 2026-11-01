import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/tools.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const tools = await import(fileUrl);
  const toolDefs = tools.TOOL_DEFINITIONS || [];
  const hasList = toolDefs.some(t => t.name === 'huaweicloud_list_operations');
  results['D9-1'] = { status: hasList ? 'PASS' : 'FAIL', hasList, why: `list_operations tool=${hasList}` };
} catch(e) { results['D9-1'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
