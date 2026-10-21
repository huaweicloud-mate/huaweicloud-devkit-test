import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const src = readFileSync(join(hdkSrc, 'tools.mjs'), 'utf-8');
// Find the serviceCatalog function and check if it handles Chinese intents
const start = src.indexOf('function serviceCatalog');
if (start >= 0) {
  const snippet = src.slice(start, start + 500);
  console.log('serviceCatalog function (first 500 chars):');
  console.log(snippet);
} else {
  console.log('function not found');
}
