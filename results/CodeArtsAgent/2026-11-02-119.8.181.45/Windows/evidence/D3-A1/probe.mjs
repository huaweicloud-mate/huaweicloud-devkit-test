import { writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const results = {};

try {
  // Check both hdk and test repo skills
  const hdkSkillsDir = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/skills';
  const testRepoSkillsDir = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/skills';
  
  let hdkCount = 0;
  if (existsSync(hdkSkillsDir)) {
    hdkCount = readdirSync(hdkSkillsDir).filter(d => existsSync(join(hdkSkillsDir, d, 'SKILL.md'))).length;
  }
  
  let testCount = 0;
  if (existsSync(testRepoSkillsDir)) {
    testCount = readdirSync(testRepoSkillsDir).filter(d => existsSync(join(testRepoSkillsDir, d, 'SKILL.md'))).length;
  }
  
  const total = hdkCount + testCount;
  results['D3-A1'] = { 
    status: total >= 20 ? 'PASS' : 'FAIL',
    hdkCount,
    testCount,
    total,
    why: `Total ${total} skills with SKILL.md (hdk=${hdkCount}, testRepo=${testCount}, need >=20)`
  };
} catch(e) { results['D3-A1'] = { status: 'BLOCKED', why: e.message }; }

writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
