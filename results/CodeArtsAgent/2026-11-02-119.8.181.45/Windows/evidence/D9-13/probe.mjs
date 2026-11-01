import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/tools.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const tools = await import(fileUrl);
  const toolDefs = tools.TOOL_DEFINITIONS || [];
  const hasSecurity = toolDefs.every(t => t.meta && typeof t.meta === 'object');
  results['D9-13'] = { status: hasSecurity ? 'PASS' : 'FAIL', hasSecurity, why: `tools have security meta=${hasSecurity}` };
} catch(e) { results['D9-13'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
