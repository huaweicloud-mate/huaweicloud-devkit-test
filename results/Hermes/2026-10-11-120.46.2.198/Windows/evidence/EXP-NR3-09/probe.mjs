// Evidence for EXP-NR3-09
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: FAIL
import { writeFileSync } from 'node:fs';
const result = {"status": "FAIL", "einvalError": "EINVAL", "worksWithShell": true, "r2status": 0, "stdout": "{\n  \"latest\": \"1.1.7\",\n  \"next\": \"1.1.8-next.2\"\n}\n", "mcpCheckFailed": true, "why": "EINVAL=true, shell:true works=true, MCP check_failed=true — expected FAIL (pre-fix state)"};
console.log(JSON.stringify(result, null, 2));
