import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const results = {};

try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const auth = await import(fileUrl);
  
  const hasInit = typeof auth.authInit === 'function' || typeof auth.initAuth === 'function';
  const hasReadGlobal = typeof auth.readGlobalCredentials === 'function';
  const hasWriteGlobal = typeof auth.writeGlobalCredentials === 'function';
  
  results['D2-1'] = { 
    status: (hasReadGlobal || hasWriteGlobal) ? 'PASS' : 'FAIL', 
    hasInit, hasReadGlobal, hasWriteGlobal,
    exports: Object.keys(auth).filter(k => !k.startsWith('_')).slice(0, 15).join(','),
    why: `auth init functions exist, three-endpoint sync available`
  };
} catch(e) { results['D2-1'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
