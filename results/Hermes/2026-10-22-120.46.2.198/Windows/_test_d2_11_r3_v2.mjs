import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const mod = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);

// Look for persistCredentials
const fns = Object.keys(mod).filter(k => k.toLowerCase().includes('persist') || k.toLowerCase().includes('switch'));
console.log('persist/switch functions:', JSON.stringify(fns));

// If we can find persistCredentials, test it
if (mod.persistCredentials) {
  // With STS token
  const r1 = mod.persistCredentials('AKTEST', 'SKTEST', 'STS-TOKEN-789', 'cn-north-4');
  console.log('persist with STS:', JSON.stringify(r1));
  
  // Without STS token
  const r2 = mod.persistCredentials('AKTEST', 'SKTEST', null, 'cn-north-4');
  console.log('persist without STS:', JSON.stringify(r2));
} else {
  console.log('persistCredentials not exported, checking source...');
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(join(hdkSrc, 'tools.mjs'), 'utf-8');
  // Check if the R3 rule exists in the source
  const hasR3 = src.includes('Temporary STS credentials cannot be persisted') && src.includes('scope: \'rejected\'');
  console.log(JSON.stringify({hasR3, status: hasR3 ? 'PASS' : 'FAIL'}));
}
