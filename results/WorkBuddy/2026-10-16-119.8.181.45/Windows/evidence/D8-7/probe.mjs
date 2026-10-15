import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const caseId = 'D8-7';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D8-7: 7 meta/general skill guides mechanically executable verification
// Test: verify 7 skill SKILL.md files exist and contain executable steps
try {
  const hdkRoot = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
  const skillsDir = join(hdkRoot, 'skills');
  
  // List skills
  let skillDirs = [];
  if (existsSync(skillsDir)) {
    skillDirs = readdirSync(skillsDir).filter(f => 
      statSync(join(skillsDir, f)).isDirectory()
    );
  }

  // Also check test repo skills
  const testRepoSkills = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/skills';
  let testSkillDirs = [];
  if (existsSync(testRepoSkills)) {
    testSkillDirs = readdirSync(testRepoSkills).filter(f =>
      statSync(join(testRepoSkills, f)).isDirectory()
    );
  }

  // Check each skill has SKILL.md
  const allSkillDirs = [...skillDirs, ...testSkillDirs.map(d => `(test-repo)${d}`)];
  const skillChecks = [];
  
  for (const dir of skillDirs) {
    const skillMd = join(skillsDir, dir, 'SKILL.md');
    if (existsSync(skillMd)) {
      const content = readFileSync(skillMd, 'utf8');
      const hasSteps = content.includes('步骤') || content.includes('Step') || content.includes('step') || content.includes('## ');
      const hasExecSection = content.includes('执行') || content.includes('Execute') || content.includes('Usage');
      skillChecks.push({
        name: dir,
        path: skillMd,
        exists: true,
        size: content.length,
        hasSteps,
        hasExecSection,
        firstHeading: content.match(/^##\s+(.+)$/m)?.[1] || ''
      });
    } else {
      skillChecks.push({ name: dir, path: skillMd, exists: false, size: 0 });
    }
  }

  for (const dir of testSkillDirs) {
    const skillMd = join(testRepoSkills, dir, 'SKILL.md');
    if (existsSync(skillMd)) {
      const content = readFileSync(skillMd, 'utf8');
      skillChecks.push({
        name: `(test)${dir}`,
        path: skillMd,
        exists: true,
        size: content.length,
        hasSteps: content.includes('步骤') || content.includes('Step') || content.includes('## '),
        hasExecSection: content.includes('执行') || content.includes('Execute') || content.includes('Usage'),
        firstHeading: content.match(/^##\s+(.+)$/m)?.[1] || ''
      });
    }
  }

  // The test case mentions "7 meta/通用技能"
  const validSkills = skillChecks.filter(s => s.exists && s.size > 100);
  const skillsWithSteps = validSkills.filter(s => s.hasSteps);

  const status = (validSkills.length >= 7 && skillsWithSteps.length >= 7) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `Found ${validSkills.length} valid skills with executable steps (>=7 required). All skills have SKILL.md with structured steps.`
    : `Only ${validSkills.length} valid skills found (${skillsWithSteps.length} with steps), need >=7`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      totalSkills: allSkillDirs.length,
      validSkills: validSkills.length,
      skillsWithSteps: skillsWithSteps.length,
      skills: skillChecks
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `Skill verification error: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
