import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const toolsPath = join(hdkSrc, 'tools.mjs');
const content = readFileSync(toolsPath, 'utf-8');

// Find the R3 rule
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('R3') || lines[i].includes('rejected') || lines[i].includes('STS') || lines[i].includes('securityToken') && lines[i].includes('persist')) {
    console.log(`Line ${i+1}: ${lines[i].trim()}`);
  }
}

// Check that the R3 rule exists
const hasR3 = content.includes('R3') && content.includes('rejected') && content.includes('STS');
console.log('\nR3 rule present:', hasR3);

// Also check that securityToken is passed per-command not persisted
const hcloudPath = join(hdkSrc, 'hcloud-cli.mjs');
const hcloudContent = readFileSync(hcloudPath, 'utf-8');
const hasPerCommand = hcloudContent.includes('R3 forbids writing') || hcloudContent.includes('per-command');
console.log('Per-command STS (R3):', hasPerCommand);
