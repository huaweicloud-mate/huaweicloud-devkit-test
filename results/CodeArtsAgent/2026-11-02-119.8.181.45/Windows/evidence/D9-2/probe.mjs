import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const mcp = await import(fileUrl);
  const hasJsonRpc = typeof mcp.handleJsonRpc === 'function' || typeof mcp.handleMcpMessage === 'function';
  results['D9-2'] = { status: hasJsonRpc ? 'PASS' : 'FAIL', hasJsonRpc, why: `JSON-RPC handling exists=${hasJsonRpc}` };
} catch(e) { results['D9-2'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
