import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const results = {};

try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/tools.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const tools = await import(fileUrl);
  const toolDefs = tools.TOOL_DEFINITIONS || [];
  const hasSchema = toolDefs.every(t => t.inputSchema && t.description);
  results['D5-3'] = { 
    status: (toolDefs.length >= 40 && hasSchema) ? 'PASS' : 'FAIL', 
    toolCount: toolDefs.length, 
    hasSchema,
    why: `${toolDefs.length} tools, all have schema=${hasSchema}`
  };
} catch(e) { results['D5-3'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
