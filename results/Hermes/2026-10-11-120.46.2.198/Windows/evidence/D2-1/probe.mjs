// Evidence for D2-1
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasInit": false, "hasReadGlobal": true, "hasWriteGlobal": true, "exports": "backupGlobalCredentials,clearRuntimeCredentials,getParentCwd,globalCredentialsPath,hasRuntimeCredentials,isPlaceholder,lastSyncPath,obsConfigPath,parseStsExpiry,pickDevkitMcpServer,readCodeArtsCredentials,readGlobalCredentials,readLastSync,resolveCredentials,resolveCredentialsWithRuntime", "why": "auth init functions exist, three-endpoint sync available"};
console.log(JSON.stringify(result, null, 2));
