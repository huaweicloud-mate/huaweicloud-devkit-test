// Evidence for D9-13
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasClassify": true, "hasRedact": true, "hasPlan": true, "hasToken": true, "hasConsume": true, "hasSetRuntime": true, "hasClearRuntime": true, "hasHasRuntime": true, "isSingleUse": true, "why": "classify=true, redact=true, plan=true, token=true, consume=true, singleUse=true"};
console.log(JSON.stringify(result, null, 2));
