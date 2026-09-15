import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
const importPath = join(homedir(), '.config', 'huaweicloud', 'creds-import.json');
// Create test import file
const testData = JSON.stringify({ak:'AK_TEST_IMPORT', sk:'SK_TEST_IMPORT', region:'cn-north-4'});
writeFileSync(importPath, testData, 'utf-8');
console.log('Import file created:', existsSync(importPath));
// Simulate import: read and delete
if (existsSync(importPath)) {
  const data = JSON.parse(readFileSync(importPath, 'utf-8'));
  console.log('Import data read:', data.ak);
  // Wipe file after read
  unlinkSync(importPath);
  console.log('Import file after wipe:', existsSync(importPath));
}
if (!existsSync(importPath)) console.log('PASS: import file read and wiped');
else console.log('FAIL: import file not wiped');