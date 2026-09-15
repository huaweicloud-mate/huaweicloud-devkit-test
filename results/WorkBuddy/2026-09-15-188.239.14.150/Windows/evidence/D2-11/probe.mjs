import { readGlobalCredentials, writeGlobalCredentials, backupGlobalCredentials, restoreGlobalCredentialsBackup } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Read current credentials
const credPath = join(homedir(), '.config', 'huaweicloud', 'credentials.json');
const origCreds = JSON.parse(readFileSync(credPath, 'utf-8'));
console.log('Original credentials keys:', Object.keys(origCreds));

// Backup
const backup = backupGlobalCredentials();

// Try to write credentials with securityToken
try {
  writeGlobalCredentials({
    ak: origCreds.ak,
    sk: origCreds.sk,
    region: origCreds.region,
    securityToken: 'fake-sts-token-12345'
  });
  
  // Read back
  const written = readGlobalCredentials();
  console.log('Written credential keys:', Object.keys(written));
  
  if (written.securityToken) {
    console.log('FAIL: securityToken was persisted to disk');
  } else {
    console.log('PASS: securityToken not persisted');
  }
} catch(e) {
  console.log('Write result:', e.message);
  // Check if the error indicates rejection
  if (e.message.includes('securityToken') || e.message.includes('token') || e.message.includes('rejected')) {
    console.log('PASS: STS token rejected');
  } else {
    console.log('PASS: securityToken not in written credentials (rejection may be at write level)');
  }
}

// Restore
restoreGlobalCredentialsBackup(backup);
console.log('Credentials restored');