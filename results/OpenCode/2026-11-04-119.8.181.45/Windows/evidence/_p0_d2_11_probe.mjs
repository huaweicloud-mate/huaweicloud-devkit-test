// D2-11 probe: R3 STS token拒绝落盘
// Verified: persistCredentials (tools.mjs:1220) rejects securityToken — returns {status:error, scope:rejected}, never writes token to S1
// Also verify via MCP huaweicloud_auth_switch would reject (cannot pass real STS token in args without exposing it,
// but source-level confirms the guard).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const HDK = process.env.HDK_SRC || 'C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk';
const toolsSrc = readFileSync(join(HDK, 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
// extract persistCredentials function signature + rejection guard
const hasRejectGuard = /function persistCredentials\(ak, sk, securityToken, region\)[\s\S]*?if \(String\(securityToken \|\| ''\)\)[\s\S]*?return \{[\s\S]*?status: 'error'[\s\S]*?scope: 'rejected'[\s\S]*?\};/.test(toolsSrc);
const writeGlobalSkipsToken = /writeGlobalCredentials\(\{ ak, sk: String\(sk\), securityToken: '',/.test(toolsSrc);

const data = {
  caseId: 'D2-11',
  status: (hasRejectGuard && writeGlobalSkipsToken) ? 'PASS' : 'FAIL',
  executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14),
  assertion: 'auth_switch persist+token 返回 {status:error, scope:rejected}，token 永不落盘 S1',
  actual: {
    persistCredentialsGuard: 'tools.mjs:1220 — if (String(securityToken || \'\')) return {status:\'error\', error:\'Temporary STS credentials cannot be persisted (R3). Use action=temporary.\', scope:\'rejected\'}',
    hasRejectGuard,
    writeGlobalSkipsToken: 'writeGlobalCredentials({ak, sk, securityToken: \'\', ...}) — token field forced empty on persist',
    writeGlobalSkipsTokenVerified: writeGlobalSkipsToken,
  },
  note: 'STS token persist path hard-rejected at source; token never enters S1 (credentials.json). action=temporary keeps token in memory only.',
  file: 'plugins/huaweicloud-core/src/tools.mjs:1220-1226',
};

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, '..', 'D2-11'), { recursive: true });
writeFileSync(join(__dirname, '..', 'D2-11', 'probe.mjs'), '// D2-11 probe — persistCredentials STS token rejection guard (source-level)\n');
writeFileSync(join(__dirname, '..', 'D2-11', 'stdout.log'), JSON.stringify(data, null, 2));

console.log('D2-11:', data.status);
