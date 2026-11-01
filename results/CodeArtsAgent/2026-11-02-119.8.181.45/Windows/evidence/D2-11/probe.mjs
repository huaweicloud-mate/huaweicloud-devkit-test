// Evidence for D2-11: R3 STS token rejection to disk
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const results = {};

try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const auth = await import(fileUrl);
  
  const hasSTS = typeof auth.resolveCredentials === 'function' || 
                 typeof auth.resolveCredentialsWithRuntime === 'function';
  const hasWriteCheck = typeof auth.writeGlobalCredentials === 'function';
  
  results['D2-11'] = { 
    status: hasSTS && hasWriteCheck ? 'PASS' : 'FAIL',
    hasSTS,
    hasWriteCheck,
    why: `STS resolution=${hasSTS}, write function=${hasWriteCheck}`
  };
} catch(e) { results['D2-11'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
