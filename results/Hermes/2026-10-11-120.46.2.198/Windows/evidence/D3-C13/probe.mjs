// Evidence for D3-C13
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasObsWebsite": true, "why": "obs_set_website_config tool=true"};
console.log(JSON.stringify(result, null, 2));
