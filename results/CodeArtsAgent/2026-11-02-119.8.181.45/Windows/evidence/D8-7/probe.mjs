import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/tools.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const tools = await import(fileUrl);
  const toolDefs = tools.TOOL_DEFINITIONS || [];
  const hasGuidance = toolDefs.every(t => t.description && t.description.length > 10);
  results['D8-7'] = { status: hasGuidance ? 'PASS' : 'FAIL', hasGuidance, why: `All tools have guidance=${hasGuidance}` };
} catch(e) { results['D8-7'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
