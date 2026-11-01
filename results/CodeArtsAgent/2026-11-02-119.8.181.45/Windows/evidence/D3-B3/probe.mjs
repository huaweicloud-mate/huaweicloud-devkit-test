import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/tools.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const tools = await import(fileUrl);
  const toolDefs = tools.TOOL_DEFINITIONS || [];
  const hasRunReadonly = toolDefs.some(t => t.name === 'huaweicloud_run_readonly_command');
  results['D3-B3'] = { status: hasRunReadonly ? 'PASS' : 'FAIL', hasRunReadonly, why: `run_readonly_command tool=${hasRunReadonly}` };
} catch(e) { results['D3-B3'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
