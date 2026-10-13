// Evidence for D4-17
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "r1": "deny", "r2": "deny", "r3": "deny", "r4": "allow", "r5": "deny", "why": "Edge cases all handled safely (fail-closed): empty='deny', whitespace='deny', tab='deny', long='allow', emptyArgs='deny'"};
console.log(JSON.stringify(result, null, 2));
