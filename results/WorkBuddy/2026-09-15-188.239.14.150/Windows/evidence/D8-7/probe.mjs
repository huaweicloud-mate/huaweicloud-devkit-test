import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const skillsDir = 'C:/Users/Administrator/.agents/skills';
const expectedSkills = [
  'huaweicloud-core',
  'huaweicloud-safety',
  'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery',
  'huaweicloud-cli-and-auth',
  'huaweicloud-troubleshooting',
  'huawei-getting-started'
];

let ok = true;
for (const skill of expectedSkills) {
  const skillPath = join(skillsDir, skill, 'SKILL.md');
  let found = existsSync(skillPath);
  if (!found) {
    // Try alternate location
    const altPath = join('C:/Users/Administrator/.config/opencode/skills', skill, 'SKILL.md');
    found = existsSync(altPath);
    if (found) {
      console.log(skill + ': found at alt path');
      const content = readFileSync(altPath, 'utf-8');
      if (content.length < 100) {
        console.log('  WARNING: content too short');
        ok = false;
      }
      continue;
    }
  }
  if (found) {
    const content = readFileSync(skillPath, 'utf-8');
    console.log(skill + ': OK (' + content.length + ' bytes)');
    if (content.length < 100) {
      console.log('  WARNING: content too short');
      ok = false;
    }
  } else {
    console.log(skill + ': MISSING');
    ok = false;
  }
}

if (ok) console.log('PASS');
else console.log('FAIL');