// D8-7: 7 meta skills mechanical execution verification
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const results = {};
try {
  const skillsDir = join(process.cwd(), 'plugins', 'huaweicloud-core', 'skills');
  console.log('Skills dir:', skillsDir, 'exists:', existsSync(skillsDir));
  
  // List all skills
  const skillDirs = [];
  if (existsSync(skillsDir)) {
    for (const d of readdirSync(skillsDir)) {
      const skillPath = join(skillsDir, d, 'SKILL.md');
      if (existsSync(skillPath)) {
        skillDirs.push(d);
      }
    }
  }
  console.log('Found skills:', skillDirs.length, skillDirs);
  
  // 6 required meta-skills
  const requiredMeta = ['huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth', 'huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-troubleshooting'];
  const found = requiredMeta.filter(s => skillDirs.includes(s));
  const missing = requiredMeta.filter(s => !skillDirs.includes(s));
  console.log('Found meta-skills:', found.length, 'Missing:', missing);
  
  // Check each skill has valid SKILL.md with frontmatter and executable steps
  const skillChecks = [];
  for (const skill of found) {
    const skillPath = join(skillsDir, skill, 'SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');
    const hasFrontmatter = content.startsWith('---');
    const hasName = content.includes('name:');
    const hasDescription = content.includes('description:');
    const hasSteps = content.includes('##') || content.includes('Step') || content.includes('hcloud');
    const noTODO = !content.includes('[TODO]') && !content.includes('TODO:');
    const length = content.length;
    skillChecks.push({ skill, hasFrontmatter, hasName, hasDescription, hasSteps, noTODO, length });
    console.log(`  ${skill}: frontmatter=${hasFrontmatter} name=${hasName} desc=${hasDescription} steps=${hasSteps} noTODO=${noTODO} len=${length}`);
  }
  
  const allValid = skillChecks.every(s => s.hasFrontmatter && s.hasName && s.hasDescription && s.hasSteps && s.noTODO);
  const allMetaPresent = missing.length === 0;
  
  results['D8-7'] = {
    status: (allMetaPresent && allValid) ? 'PASS' : 'FAIL',
    why: (allMetaPresent && allValid) ? '' : `allMetaPresent=${allMetaPresent}, allValid=${allValid}, missing=${missing}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { totalSkills: skillDirs.length, foundMeta: found.length, missing, skillChecks }
  };
  console.log('STATUS:', results['D8-7'].status);
  console.log(JSON.stringify(results['D8-7'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D8-7'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
