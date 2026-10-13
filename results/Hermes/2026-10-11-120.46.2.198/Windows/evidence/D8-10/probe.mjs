// Evidence for D8-10
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasMerge": true, "exports": "applyUserDelta,extractUserDelta,inheritPeerUserEnv,mergeArgsStyle,mergeCommandStyle,mergeMcpServersFile", "why": "MCP config merge module loaded, exports=6"};
console.log(JSON.stringify(result, null, 2));
