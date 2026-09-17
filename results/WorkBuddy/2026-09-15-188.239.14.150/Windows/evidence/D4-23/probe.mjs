import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Check if agent-rules.md exists in the package
const pkgPath = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit';
const rulesPaths = [
  join(pkgPath, 'plugins', 'huaweicloud-core', 'data', 'huawei-agent-rules.md'),
  join(pkgPath, 'huawei-agent-rules.md'),
  join(pkgPath, 'plugins', 'huaweicloud-core', 'huawei-agent-rules.md'),
];

let found = false;
let content = '';
for (const p of rulesPaths) {
  if (existsSync(p)) {
    found = true;
    content = readFileSync(p, 'utf-8');
    console.log('Found rules at:', p);
    break;
  }
}

if (!found) {
  // Check in hdk source
  const hdkPaths = [
    'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/data/huawei-agent-rules.md',
    'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/huawei-agent-rules.md',
  ];
  for (const p of hdkPaths) {
    if (existsSync(p)) {
      found = true;
      content = readFileSync(p, 'utf-8');
      console.log('Found rules at:', p);
      break;
    }
  }
}

if (found) {
  // Check for MUST constraints
  const hasMUST = content.includes('MUST') || content.includes('must');
  const hasDirectConnectRule = content.includes('csms') || content.includes('kms') || content.includes('direct');
  console.log('Has MUST constraints:', hasMUST);
  console.log('Has direct connect rules:', hasDirectConnectRule);
  console.log('Content length:', content.length);
  if (hasMUST) {
    console.log('PASS: agent-rules.md exists with MUST constraints');
  } else {
    console.log('FAIL: agent-rules.md exists but no MUST constraints');
  }
} else {
  console.log('FAIL: agent-rules.md not found');
}