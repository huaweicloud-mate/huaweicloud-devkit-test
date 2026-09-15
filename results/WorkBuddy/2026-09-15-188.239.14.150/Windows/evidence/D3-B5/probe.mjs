import { detectFramework } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/detect-framework.mjs';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
// Create a test React project
const tmpDir = mkdtempSync(join(tmpdir(), 'hdk-test-'));
writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({name:'test',dependencies:{react:'^18.0.0'}}));
writeFileSync(join(tmpDir, 'vite.config.js'), 'export default {}');
const result = await detectFramework(tmpDir);
console.log('Detected:', JSON.stringify(result));
try { import('fs').then(fs => fs.rmSync(tmpDir, {recursive:true})); } catch {}
if (result && result.framework) console.log('PASS: framework detected');
else console.log('FAIL: no framework detected');