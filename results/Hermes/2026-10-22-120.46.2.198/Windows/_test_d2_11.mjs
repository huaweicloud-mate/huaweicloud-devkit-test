import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import * as os from 'node:os';

const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const mod = await import(pathToFileURL(join(hdkSrc, 'auth/credentials.mjs')).href);
console.log('exports:', Object.keys(mod).sort().join(', '));

const writeCreds = mod.writeGlobalCredentials;
const readCreds = mod.readGlobalCredentials;
const credsPath = mod.globalCredentialsPath;

console.log('writeCreds type:', typeof writeCreds);
console.log('readCreds type:', typeof readCreds);
console.log('credsPath type:', typeof credsPath);

const tmpHome = join(os.tmpdir(), 'hdk-d2-11-test-' + Date.now());
mkdirSync(join(tmpHome, '.hcloud'), { recursive: true });
process.env.HOME = tmpHome;
process.env.HUAWEICLOUD_HOME = join(tmpHome, '.hcloud');

try {
  const result = await writeCreds({ak:'AKTEST123',sk:'SKTEST456',securityToken:'STS-TOKEN-789',region:'cn-north-4'});
  console.log('write result:', JSON.stringify(result));
} catch(e) {
  console.log('write error:', e.message);
}

try {
  const creds = readCreds();
  console.log('read creds:', JSON.stringify(creds));
  console.log('has token:', !!(creds && (creds.securityToken || creds.security_token)));
} catch(e) {
  console.log('read error:', e.message);
}

// Check raw file
const credsFilePath = credsPath ? credsPath() : join(tmpHome, '.hcloud', 'credentials.json');
console.log('creds file path:', credsFilePath);
try {
  const raw = readFileSync(credsFilePath, 'utf-8');
  console.log('raw file:', raw.slice(0, 200));
  console.log('contains STS-TOKEN:', raw.includes('STS-TOKEN'));
} catch(e) {
  console.log('file read error:', e.message);
}

try { rmSync(tmpHome, {recursive: true}); } catch(e) {}
