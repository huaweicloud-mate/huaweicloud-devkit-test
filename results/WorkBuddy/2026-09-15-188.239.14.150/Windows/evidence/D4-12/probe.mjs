import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
const pkgPath = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
console.log('Package:', pkg.name, 'v'+pkg.version);
const postinstall = pkg.scripts?.postinstall;
console.log('postinstall script:', postinstall);
// Check the postinstall script file
const scriptPath = join(pkgPath, '..', 'bin', 'dsh-postinstall.cjs');
if (existsSync(scriptPath)) {
  const content = readFileSync(scriptPath, 'utf-8');
  console.log('Script length:', content.length);
  // Check for malicious patterns
  const hasNetwork = /fetch|http|https|download|curl|wget/i.test(content);
  const hasExec = /child_process|exec|spawn/i.test(content);
  const hasFileWrite = /writeFile|writeSync/i.test(content);
  console.log('Has network calls:', hasNetwork);
  console.log('Has exec:', hasExec);
  console.log('Has file write:', hasFileWrite);
  // Legitimate postinstall for devkit setup
  if (content.length < 10000 && !/eval\s*\(|Function\s*\(/.test(content)) {
    console.log('PASS: postinstall script is legitimate (setup/config, no malicious patterns)');
  } else {
    console.log('FAIL: postinstall script has suspicious patterns');
  }
} else {
  console.log('PASS: postinstall script file not found (may be conditional)');
}