import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const rec = { status: 'FAIL', why: "handleObsWebsiteConfig set/get 实测 HTTP 400（InvalidArgument: x-amz-security-token header but signed headers not included）；根因 tools.mjs obsSignedRequest L3041 signedHeaders 未含 x-amz-security-token", executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-C13' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);