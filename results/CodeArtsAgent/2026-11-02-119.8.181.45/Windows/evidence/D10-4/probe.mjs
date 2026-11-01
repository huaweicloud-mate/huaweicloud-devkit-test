import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const mcp = await import(fileUrl);
  const hasRoute = typeof mcp.routeRequest === 'function' || typeof mcp.handleMcpRequest === 'function';
  results['D10-4'] = { status: hasRoute ? 'PASS' : 'FAIL', hasRoute, why: `request routing exists=${hasRoute}` };
} catch(e) { results['D10-4'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
