import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const results = {};

try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/tools.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const tools = await import(fileUrl);
  const toolDefs = tools.TOOL_DEFINITIONS || tools.default || [];
  const hasCheckUpdate = Array.isArray(toolDefs) ? toolDefs.some(t => t.name?.includes('check_update')) : false;
  const hasUpgrade = Array.isArray(toolDefs) ? toolDefs.some(t => t.name?.includes('upgrade')) : false;
  results['D1-26'] = { 
    status: (hasCheckUpdate && hasUpgrade) ? 'PASS' : 'FAIL', 
    hasCheckUpdate, 
    hasUpgrade,
    why: `check_update=${hasCheckUpdate}, upgrade=${hasUpgrade}`
  };
} catch(e) { results['D1-26'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
