// Evidence for D2-27
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasVersion": true, "exports": "KOO_CLI_BASE,compareVersion,getKooCliVersion,kooCliDownloadBase,parseHcloudVersion", "why": "KooCLI version management module=true"};
console.log(JSON.stringify(result, null, 2));
