import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import * as os from 'node:os';

const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const mod = await import(pathToFileURL(join(hdkSrc, 'auth/credentials.mjs')).href);

// Use isolated HOME
const tmpHome = join(os.tmpdir(), 'hdk-d2-11-iso-' + Date.now());
mkdirSync(join(tmpHome, '.hcloud'), { recursive: true });
process.env.HOME = tmpHome;
process.env.USERPROFILE = tmpHome;
process.env.HUAWEICLOUD_HOME = join(tmpHome, '.hcloud');

// First write normal creds (no STS)
await mod.writeGlobalCredentials({ak:'AKTEST', sk:'SKTEST', region:'cn-north-4'});
console.log('Step 1: Normal creds written');

// Now read them back
const c1 = mod.readGlobalCredentials();
console.log('Step 2: Read back:', JSON.stringify({ak: c1?.ak, hasToken: !!(c1?.securityToken || c1?.security_token)}));

// Now try writing with securityToken  
await mod.writeGlobalCredentials({ak:'AKTEST2', sk:'SKTEST2', securityToken:'STS-TOKEN-789', region:'cn-north-4'});
const c2 = mod.readGlobalCredentials();
console.log('Step 3: After write with STS:', JSON.stringify({ak: c2?.ak, hasToken: !!(c2?.securityToken || c2?.security_token), token: c2?.securityToken}));

// Check raw file
const credsFile = mod.globalCredentialsPath();
const raw = readFileSync(credsFile(), 'utf-8');
console.log('Step 4: Raw file contains STS-TOKEN:', raw.includes('STS-TOKEN'));

// The test is whether the source-level function strips the token.
// If it doesn't strip, this is the expected behavior - the R3 rule is 
// enforced at the auth_switch MCP tool level, not at writeGlobalCredentials.
// So the test should verify via auth_switch tool, not via direct writeGlobalCredentials.

// However, we can test the resolveCredentials path to see if STS is handled
try {
  const resolved = mod.resolveCredentials ? mod.resolveCredentials() : null;
  console.log('Step 5: resolveCredentials:', JSON.stringify(resolved ? {hasToken: !!resolved.securityToken, keys: Object.keys(resolved).slice(0,5)} : null));
} catch(e) {
  console.log('Step 5: resolveCredentials error:', e.message.slice(0,80));
}

try { rmSync(tmpHome, {recursive: true}); } catch(e) {}
