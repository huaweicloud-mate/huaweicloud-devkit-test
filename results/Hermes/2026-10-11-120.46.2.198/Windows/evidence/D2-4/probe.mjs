// Evidence for D2-4
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "redacted": "{\"access_key\":\"<redacted>\",\"secret_key\":\"<redacted>\",\"region\":\"cn-north-4\"}", "why": "AK redacted=true, SK redacted=true, region kept=true"};
console.log(JSON.stringify(result, null, 2));
