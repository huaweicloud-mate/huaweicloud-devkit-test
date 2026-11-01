import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const results = {};

try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/tools.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const tools = await import(fileUrl);
  const toolCount = (tools.TOOL_DEFINITIONS || []).length;
  results['D5-1'] = { 
    status: toolCount >= 40 ? 'PASS' : 'FAIL', 
    toolCount,
    why: `Tool definitions count=${toolCount} (need >=40)`
  };
} catch(e) { results['D5-1'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
